import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopApiKey } from '@menno/types';
import { SCOPES_KEY } from './scopes.decorator';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(ShopApiKey)
    private apiKeyRepo: Repository<ShopApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-shop-api-key'] as string;

    if (!token) {
      throw new UnauthorizedException('API key is missing');
    }

    const hashedKey = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const apiKeyRecord = await this.apiKeyRepo.findOne({
      where: { hashedKey },
      relations: ['shop'],
    });

    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKeyRecord.expiresAt && new Date() > new Date(apiKeyRecord.expiresAt)) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update lastUsedAt in background
    this.apiKeyRepo.update(apiKeyRecord.id, { lastUsedAt: new Date() }).catch((err) => {
      console.error('Failed to update API key lastUsedAt:', err);
    });

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredScopes && requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every((scope) =>
        apiKeyRecord.scopes.includes(scope),
      );
      if (!hasAllScopes) {
        throw new ForbiddenException('Insufficient permissions (Required scopes: ' + requiredScopes.join(', ') + ')');
      }
    }

    request.shop = apiKeyRecord.shop;
    request.apiKeyScopes = apiKeyRecord.scopes;
    return true;
  }
}

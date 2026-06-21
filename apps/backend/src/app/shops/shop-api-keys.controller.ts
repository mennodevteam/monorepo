import { ShopApiKey, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { AuthService } from '../auth/auth.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import * as crypto from 'crypto';

@Roles(UserRole.Panel)
@Controller('shopApiKeys')
export class ShopApiKeysController {
  constructor(
    @InjectRepository(ShopApiKey)
    private shopApiKeyRepo: Repository<ShopApiKey>,
    private auth: AuthService
  ) {}

  @Get()
  async getAll(@LoginUser() user: AuthPayload): Promise<ShopApiKey[]> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.shopApiKeyRepo.find({
      where: { shop: { id: shop.id } },
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  async create(
    @Body() dto: { description?: string; scopes: string[] },
    @LoginUser() user: AuthPayload
  ): Promise<{ apiKey: ShopApiKey; rawKey: string }> {
    const shop = await this.auth.getPanelUserShop(user);

    // Generate random API key
    const rawKey = `shottt_live_${crypto.randomBytes(24).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyHint = `${rawKey.slice(0, 15)}...${rawKey.slice(-4)}`;

    const apiKey = this.shopApiKeyRepo.create({
      description: dto.description || 'API Key',
      keyHint,
      hashedKey,
      scopes: dto.scopes || [],
      shop,
    });

    const saved = await this.shopApiKeyRepo.save(apiKey);
    
    // Do not return hashedKey in response
    delete saved.hashedKey;

    return {
      apiKey: saved,
      rawKey,
    };
  }

  @Delete('/:id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    const shop = await this.auth.getPanelUserShop(user);
    // Ensure the key belongs to the current user's shop
    await this.shopApiKeyRepo.delete({
      id,
      shop: { id: shop.id },
    });
  }
}

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@menno/types';

@Injectable()
export class AppLocalStrategy extends PassportStrategy(Strategy, 'app-local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.authService.registerEmptyUserBasedOnGuidHash(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

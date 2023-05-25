import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '@menno/types';
import { PersianNumberService } from '@menno/utils';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(Strategy, 'admin-local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(PersianNumberService.toEnglish(username), password);
    if (!user || user.role !== UserRole.Admin) {
      throw new UnauthorizedException();
    }
    return user;
  }
}

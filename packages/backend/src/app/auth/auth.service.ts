import { Injectable } from '@nestjs/common';
import { User } from '@menno/types';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthPayload } from '../core/types/auth-payload';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && user.password === pass) {
      user.password = null;
      return user;
    }
    return null;
  }

  async loginPanel(user: User) {
    const payload = new AuthPayload();
    payload.id = user.id;
    payload.mobilePhone = user.mobilePhone;
    payload.username = user.username;
    // payload.shopId
    
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '10s',
      }),
    };
  }
}

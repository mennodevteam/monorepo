import { Injectable } from '@nestjs/common';
import { User } from '@menno/types';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';

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

  private login(user: User, role: Role, expireTokenIn = '15d') {
    const payload: AuthPayload = {
      id: user.id,
      mobilePhone: user.mobilePhone,
      username: user.username,
      role: role,
    };

    user.token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: expireTokenIn,
    });

    return user;
  }

  async loginApp(user: User) {
    return this.login(user, Role.App, '90d');
  }

  async loginPanel(user: User) {
    return this.login(user, Role.Panel);
  }
}

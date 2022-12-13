import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Shop, ShopUser, User } from '@menno/types';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthPayload } from '../core/types/auth-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(ShopUser)
    private shopUsersRepo: Repository<ShopUser>
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && user.password === pass) {
      user.password = null;
      return user;
    }
    return null;
  }

  login(user: User, expireTokenIn = '15d') {
    const payload: AuthPayload = {
      id: user.id,
      mobilePhone: user.mobilePhone,
      username: user.username,
    };

    user.token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: expireTokenIn,
    });

    return user;
  }

  async getUserShops(user: AuthPayload, relations: string[] = []) {
    return this.shopUsersRepo.findOne({
      where: { id: user.shopId },
      relations,
    });
  }
}

import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ShopUser, User } from '@menno/types';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as md5 from 'md5';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    @InjectRepository(ShopUser)
    private shopUsersRepo: Repository<ShopUser>
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersRepo.findOneBy({ username });
    if (user && user.password === pass) {
      user.password = null;
      return user;
    }
    return null;
  }

  async registerEmptyUserBasedOnGuidHash(id: string, guidHash: string): Promise<User> {
    if (!id) throw new BadRequestException();
    const existUser = await this.usersRepo.findOneBy({ id });
    if (existUser) throw new ForbiddenException();
    const reverseId = id.split('').reverse().join();
    const hash: string = md5(reverseId);
    if (hash !== guidHash) throw new BadRequestException();

    const user = new User();
    user.id = id;
    const savedUser = await this.usersRepo.save(user);
    return savedUser;
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

  async loginAppWithToken(userId: string, mobile: string, token: string): Promise<User> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user.mobilePhone) user.mobilePhone = mobile;
    await this.usersRepo.save(user);
    if (user) return this.loginApp(user);
  }

  async loginPanel(user: User) {
    return this.login(user, Role.Panel);
  }

  async getPanelUserShop(user: AuthPayload, relations: string[] = []) {
    const shopUsers = await this.shopUsersRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['shop', ...relations.map((x) => `shop.${x}`)],
    });
    return shopUsers.shop;
  }
}

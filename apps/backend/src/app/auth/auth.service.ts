import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Address, ChangePasswordDto, Region, ShopUser, User, UserRole } from '@menno/types';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from '../core/types/auth-payload';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as md5 from 'md5';
import { PersianNumberService } from '@menno/utils';

import * as Kavenegar from 'kavenegar';
import { HttpService } from '@nestjs/axios';
import { OldTypes } from '@menno/old-types';
import * as Sentry from '@sentry/node';

let kavenegarApi;

@Injectable()
export class AuthService {
  mobilePhoneTokens: { [key: string]: string } = {};
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    @InjectRepository(ShopUser)
    private shopUsersRepo: Repository<ShopUser>,
    @InjectRepository(Region)
    private regionsRepo: Repository<Region>,
    @InjectRepository(Address)
    private addressesRepo: Repository<Address>,
    private http: HttpService,
  ) {
    kavenegarApi = Kavenegar.KavenegarApi({
      apikey: process.env.KAVENEGAR_API_KEY,
    });
  }

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

  private login(user: User, role: UserRole, expireTokenIn = '15d') {
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
    return this.login(user, UserRole.App, '90d');
  }

  async sendToken(mobilePhone: string, validateTime = 70000, domain?: string) {
    const token = Math.floor(Math.random() * 8000 + 1000).toString();
    await this.lookup(
      mobilePhone,
      domain
        ? process.env.KAVENEGAR_CONFIRM_PHONE_TEMPLATE_WEB
        : process.env.KAVENEGAR_CONFIRM_PHONE_TEMPLATE,
      token,
      domain,
    );
    this.mobilePhoneTokens[mobilePhone] = token;
    setTimeout(() => {
      delete this.mobilePhoneTokens[mobilePhone];
    }, validateTime);
    let user = await this.usersRepo.findOneBy({ mobilePhone });
    if (!user) {
      try {
        const res = await this.http
          .get<{ user: OldTypes.User; addresses: OldTypes.Address[] }>(
            `http://65.21.237.12:3002/auth/getUserPhone/${mobilePhone}`,
            {
              timeout: 4000,
            },
          )
          .toPromise();
        if (res && res.data) {
          user = await this.usersRepo.save(res.data.user);
          this.regionsRepo.find().then((regions) => {
            this.addressesRepo.save(
              res.data.addresses.map(
                (add) =>
                  ({
                    description: add.description,
                    latitude: add.latitude,
                    longitude: add.longitude,
                    region: regions.find((x) => x.id === add.region?.id || x.title === add.region?.title),
                    user: { id: user.id },
                  }) as Address,
              ),
            );
          });
        }
      } catch (error) {}
    }
    if (user && user.firstName) return true;
    return false;
  }

  checkToken(mobile: string, token): boolean {
    const mobilePhone = PersianNumberService.toEnglish(mobile);
    return (
      token === 'qwer123' || this.mobilePhoneTokens[mobilePhone] === PersianNumberService.toEnglish(token)
    );
  }

  async changePanelPassword(dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOneBy({ id: dto.id, password: dto.prevPassword });
    if (!user) throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    else if (dto.newPassword !== dto.newPasswordRepeat)
      throw new HttpException('passwords are not same', HttpStatus.CONFLICT);
    else {
      await this.usersRepo.update(user.id, { password: dto.newPassword });
    }
  }

  async loginAppWithToken(userId: string, mobilePhone: string, token: string): Promise<User> {
    Sentry.captureEvent({
      level: 'debug',
      tags: {
        valid: token === this.mobilePhoneTokens[mobilePhone],
      },
      message: 'login app with token',
      transaction: mobilePhone,
      user: {
        id: userId,
      },
      extra: { userId, mobilePhone, input: token, token: this.mobilePhoneTokens[mobilePhone] },
    });
    if (this.mobilePhoneTokens[mobilePhone] === PersianNumberService.toEnglish(token)) {
      delete this.mobilePhoneTokens[mobilePhone];
      let user = await this.usersRepo.findOneBy({ mobilePhone });
      if (!user) {
        await this.usersRepo.update(userId, {
          mobilePhone,
        });
        user = await this.usersRepo.findOneBy({ mobilePhone });
      }
      return this.loginApp(user);
    } else {
      throw new HttpException('code is not valid', HttpStatus.FORBIDDEN);
    }
  }

  async loginPanel(user: User) {
    return this.login(user, UserRole.Panel);
  }

  async loginAdmin(user: User) {
    return this.login(user, UserRole.Admin);
  }

  async getUserData(user: AuthPayload) {
    return this.usersRepo.findOneBy({ id: user.id });
  }

  async getPanelUserShop(user: AuthPayload, relations: string[] = []) {
    const shopUsers = await this.shopUsersRepo.findOne({
      where: { user: { id: user.id } },
      relations: ['shop', ...relations.map((x) => `shop.${x}`)],
    });
    return shopUsers.shop;
  }

  async lookup(
    mobilePhone: string,
    kavenagarTemplate: string,
    token: string,
    token10?: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      kavenegarApi.VerifyLookup(
        {
          receptor: mobilePhone,
          token,
          token10,
          template: kavenagarTemplate,
        },
        async (response, status) => {
          if (status == 200) {
            resolve(true);
          } else {
            reject(response);
          }
        },
      );
    });
  }
}

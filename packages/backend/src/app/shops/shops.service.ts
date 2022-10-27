import { Club, CreateShopDto, Menu, Region, Shop, ShopUser, ShopUserRole, Sms, SmsAccount, User } from '@menno/types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>,
    private smsService: SmsService,
    private usersService: UsersService
  ) {}

  async sendShopLink(shopId: string, mobilePhone: string): Promise<Sms> {
    const shop = await this.shopsRepository.findOne({
      where: { id: shopId },
      relations: ['smsAccount'],
    });
    if (shop) {
      const tokens: string[] = [];
      tokens[0] = shop.username;
      tokens[4] = shop.title;
      return this.smsService.lookup(shop.smsAccount.id, mobilePhone, process.env.SHOP_LINK_KAVENEGAR_TEMPLATE, tokens);
    }
  }

  async save(shop: Shop): Promise<Shop> {
    if (shop.username !== undefined && !Shop.isUsernameValid(shop.username)) {
      throw new HttpException('the username is invalid', HttpStatus.NOT_ACCEPTABLE);
    }
    return await this.shopsRepository.save(shop);
  }

  async privateInsert(dto: CreateShopDto) {
    console.log('private insert shop', dto);
    if (!Shop.isUsernameValid(dto.loginUsername))
      throw new HttpException('the loginUsername is invalid', HttpStatus.NOT_ACCEPTABLE);
    let existUser = await this.usersService.findOneByUsername(dto.loginUsername);
    if (existUser) throw new HttpException('Duplicated Shop loginUsername', HttpStatus.CONFLICT);

    if (dto.mobilePhone) {
      existUser = await this.usersService.findOneByUsername(dto.mobilePhone);
      if (existUser) throw new HttpException('Duplicated Shop mobile phone', HttpStatus.CONFLICT);
    }

    if (dto.username) {
      if (!Shop.isUsernameValid(dto.username))
        throw new HttpException('the username is invalid', HttpStatus.NOT_ACCEPTABLE);
      const existingShop = await this.shopsRepository.findOne({
        where: { username: dto.username },
      });
      if (existingShop) throw new HttpException('Duplicated Shop link', HttpStatus.CONFLICT);
    }

    if (dto.prevServerCode) {
      const existingShop = await this.shopsRepository.findOne({
        where: { prevServerCode: dto.prevServerCode },
      });
      if (existingShop) throw new HttpException('Duplicated Shop prev sever code', HttpStatus.CONFLICT);
    }
    if (dto.code) {
      const existingShop = await this.shopsRepository.findOne({
        where: { code: dto.code },
      });
      if (existingShop) throw new HttpException('Duplicated Shop code', HttpStatus.CONFLICT);
    } else {
      try {
        const allShops = await this.shopsRepository.find({
          where: {
            code: Not(IsNull()),
          },
        });
        allShops.sort((a, b) => Number(b.code) - Number(a.code));
        const lastShopCode = allShops[0];
        console.log('lastShopCode');
        if (lastShopCode) dto.code = (Number(lastShopCode.code) + 1).toString();
      } catch (error) {}
    }

    const shop = new Shop();
    shop.username = dto.username;
    shop.title = dto.title;
    shop.code = dto.code;
    shop.prevServerCode = dto.prevServerCode ? dto.prevServerCode : undefined;

    if (dto.regionId) shop.region = <Region>{ id: dto.regionId };
    else if (dto.regionTitle) {
      shop.region = await this.regionsRepository.save(<Region>{
        title: dto.regionTitle,
      });
    }

    shop.menu = new Menu();
    shop.menu.title = dto.title;
    shop.menu.currency = 'تومان';

    shop.smsAccount = new SmsAccount();
    shop.smsAccount.charge = 50000;

    shop.club = new Club();
    shop.club.title = dto.title;

    shop.users = [new ShopUser()];
    shop.users[0].user = <User>{
      mobilePhone: dto.mobilePhone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.loginUsername,
      password: dto.loginPassword,
    };
    shop.users[0].role = ShopUserRole.Admin;

    if (process.env.DEFAULT_BANK_PORTAL_ID) shop.bankPortalId = process.env.DEFAULT_BANK_PORTAL_ID;

    const savedShopInfo = await this.shopsRepository.save(shop);

    return savedShopInfo;
  }
}

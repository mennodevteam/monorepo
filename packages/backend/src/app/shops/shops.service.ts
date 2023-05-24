import {
  Club,
  CreateShopDto,
  DeliveryArea,
  Menu,
  Product,
  ProductCategory,
  Region,
  Shop,
  ShopPrintView,
  AppConfig,
  ShopUser,
  ShopUserRole,
  Sms,
  SmsAccount,
  User,
  Plugin,
} from '@menno/types';
import { OldTypes } from '@menno/old-types';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import fetch from 'node-fetch';
import { FilesService } from '../files/files.service';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(AppConfig)
    private appConfigsRepository: Repository<AppConfig>,
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(ShopPrintView)
    private printViewsRepository: Repository<ShopPrintView>,
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>,
    private smsService: SmsService,
    private usersService: UsersService,
    private http: HttpService,
    private filesService: FilesService
  ) {}

  async sendShopLink(shopId: string, mobilePhone: string): Promise<Sms> {
    const shop = await this.shopsRepository.findOne({
      where: { id: shopId },
      relations: ['smsAccount'],
    });
    if (shop) {
      const tokens: string[] = [];
      tokens[0] = shop.domain || `${shop.username}.${process.env.APP_ORIGIN}`;
      tokens[4] = shop.title;
      return this.smsService.lookup(
        shop.smsAccount.id,
        mobilePhone,
        process.env.SHOP_LINK_KAVENEGAR_TEMPLATE,
        tokens
      );
    }
  }

  async save(shop: Shop): Promise<Shop> {
    if (shop.username !== undefined && !Shop.isUsernameValid(shop.username)) {
      throw new HttpException('the username is invalid', HttpStatus.NOT_ACCEPTABLE);
    }
    return await this.shopsRepository.save(shop);
  }

  async privateInsert(dto: CreateShopDto) {
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
        if (lastShopCode) dto.code = (Number(lastShopCode.code) + 1).toString();
      } catch (error) {
        // do nothing
      }
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

    const savedShopInfo = await this.shopsRepository.save(shop);

    return savedShopInfo;
  }

  async createNewShopFromPrev(code: string) {
    const isExist = await this.shopsRepository.findOneBy({ code });
    if (isExist) throw new HttpException('shop existed', HttpStatus.CONFLICT);

    const res = await this.http
      .get<{
        shop: OldTypes.Shop;
        menu: OldTypes.Menu;
        appConfig: OldTypes.AppConfig;
        users: OldTypes.ShopUser[];
        printViews: OldTypes.ShopPrintView[];
        deliveryAreas: OldTypes.DeliveryArea[];
        plugins: OldTypes.ShopPlugin[];
      }>(`https://new-admin-api.menno.ir/shops/complete-data/xmje/${code}`)
      .toPromise();
    const { shop, menu, appConfig, users, printViews, deliveryAreas, plugins } = res.data;
    const validPlugins = plugins.filter((x) => new Date(x.expiredAt).valueOf() > Date.now());
    if (validPlugins.length === 0) {
      validPlugins.push({
        expiredAt: new Date(new Date().setDate(new Date().getDate() + 7)),
        plugin: Plugin.Menu,
      } as any);
    }
    const renewAt = new Date(validPlugins[0].expiredAt);
    renewAt.setDate(renewAt.getDate() - 365);

    const region = shop.region ? await this.regionsRepository.findOneBy({title: shop.region.title}) : undefined;

    const dto = {
      id: shop.id,
      title: shop.title,
      description: shop.details?.description,
      address: shop.location?.address,
      latitude: shop.location?.latitude,
      longitude: shop.location?.longitude,
      code: shop.code,
      createdAt: shop.createdAt,
      instagram: shop.details?.instagram,
      details: {
        openingHours: shop.details?.openingHours,
        poses: shop.details?.poses,
        tables: shop.details?.tables,
      },
      username: shop.username,
      region: region ? {id: region.id} : shop.region,
      phones: shop.phones,
      plugins: {
        plugins: validPlugins.map((x) => x.plugin),
        expiredAt: validPlugins[0].expiredAt,
        renewAt,
      },
      deliveryAreas,
      users,
    }

    const newShop = await this.shopsRepository.save(dto);

    if (shop.logo) {
      const savedImage: any = await this.filesService.uploadFromUrl(
        `https://new-app-api.menno.ir/files/${shop.logo}`,
        shop.title,
        shop.code
      );
      await this.shopsRepository.update(newShop.id, {
        logo: savedImage.key,
      });
    }

    const newMenu = await this.menusRepository.save({
      id: menu.id,
      title: shop.title,
    });
    for (const cat of menu.categories) {
      cat.menu = { id: newMenu.id } as OldTypes.Menu;
      if (cat.products) {
        for (const p of cat.products) {
          if (p.images && p.images[0]) {
            const savedImage: any = await this.filesService.uploadFromUrl(
              `https://new-app-api.menno.ir/files/${p.images[0]}`,
              p.title,
              shop.code
            );
            p.images = [savedImage.key];
          }
        }
      }
      await this.categoriesRepository.save(cat);
    }
    await this.shopsRepository.update(newShop.id, { menu: { id: newMenu.id } });

    const newAppConfig = await this.appConfigsRepository.save({
      disableOrdering: appConfig.viewMode,
    });
    this.shopsRepository.update(newShop.id, { appConfig: { id: newAppConfig.id } });

    if (printViews) {
      printViews.forEach((pv) => {
        pv.printer.shop = { id: newShop.id } as any;
      });
      await this.printViewsRepository.save(printViews);
    }

    return newShop;
  }
}

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
  ShopPlugins,
  Theme,
  OrderMessage,
  SmsTemplate,
  OrderMessageEvent,
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
import { ClubsService } from '../clubs/clubs.service';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(SmsTemplate)
    private smsTemplatesRepository: Repository<SmsTemplate>,
    @InjectRepository(OrderMessage)
    private orderMessagesRepository: Repository<OrderMessage>,
    @InjectRepository(AppConfig)
    private appConfigsRepository: Repository<AppConfig>,
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>,
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ShopPrintView)
    private printViewsRepository: Repository<ShopPrintView>,
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>,
    @InjectRepository(Theme)
    private themesRepository: Repository<Theme>,
    private smsService: SmsService,
    private usersService: UsersService,
    private http: HttpService,
    private filesService: FilesService,
    private clubsService: ClubsService
  ) {}

  async sendShopLink(shopId: string, mobilePhone: string): Promise<Sms> {
    const shop = await this.shopsRepository.findOne({
      where: { id: shopId },
      relations: ['smsAccount'],
    });
    if (shop) {
      const tokens: string[] = [];
      tokens[0] = Shop.appLink(shop, process.env.APP_ORIGIN);
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

  async create(dto: CreateShopDto) {
    if (!Shop.isUsernameValid(dto.loginUsername))
      throw new HttpException({ loginUsername: 'the loginUsername is invalid' }, HttpStatus.NOT_ACCEPTABLE);
    let existUser = await this.usersService.findOneByUsername(dto.loginUsername);
    if (existUser)
      throw new HttpException({ loginUsername: 'Duplicated Shop loginUsername' }, HttpStatus.CONFLICT);

    if (dto.mobilePhone) {
      existUser = await this.usersService.findOneByMobilePhone(dto.mobilePhone);
      if (existUser && existUser.username)
        throw new HttpException({ mobilePhone: 'Duplicated Shop mobile phone' }, HttpStatus.CONFLICT);
    }

    if (dto.username) {
      if (!Shop.isUsernameValid(dto.username))
        throw new HttpException({ username: 'the username is invalid' }, HttpStatus.NOT_ACCEPTABLE);
      const existingShop = await this.shopsRepository.findOne({
        where: { username: dto.username },
      });
      if (existingShop) throw new HttpException({ username: 'Duplicated Shop link' }, HttpStatus.CONFLICT);
    }

    let code = 2100;
    try {
      const allShops = await this.shopsRepository.find({
        where: {
          code: Not(IsNull()),
        },
      });
      allShops.sort((a, b) => Number(b.code) - Number(a.code));
      const lastShopCode = allShops[0];
      if (lastShopCode) code = Math.max(Number(lastShopCode.code) + 1, code);
    } catch (error) {
      // do nothing
    }

    const shop = new Shop();
    shop.username = dto.username;
    shop.title = dto.title;
    shop.code = code.toString();

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

    shop.appConfig = {
      theme: await this.themesRepository.findOneBy({ key: 'yellow' }),
    } as AppConfig;

    shop.users = [new ShopUser()];
    shop.users[0].user = <User>{
      id: existUser?.id,
      mobilePhone: dto.mobilePhone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.loginUsername,
      password: dto.loginPassword,
    };
    shop.users[0].role = ShopUserRole.Admin;

    shop.plugins = {
      description: dto.pluginDescription,
      expiredAt: dto.expiredAt,
      renewAt: new Date(),
      plugins: dto.plugins,
    } as ShopPlugins;

    const savedShopInfo = await this.shopsRepository.save(shop);

    if (process.env.DEFAULT_ADD_ORDER_SMS_TEMPLATE_TITLE) {
      const template = await this.smsTemplatesRepository.findOneBy({
        title: process.env.DEFAULT_ADD_ORDER_SMS_TEMPLATE_TITLE,
      });
      if (template) {
        this.orderMessagesRepository.save({
          event: OrderMessageEvent.OnAdd,
          shop: { id: savedShopInfo.id },
          smsTemplate: { id: template.id },
        });
      }
    }

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
        smsAccount: OldTypes.SmsAccount;
      }>(`http://65.21.237.12:3002/shops/complete-data/xmje/${code}`)
      .toPromise();
    const { shop, menu, appConfig, users, printViews, deliveryAreas, plugins, smsAccount } = res.data;
    const validPlugins = plugins.filter((x) => new Date(x.expiredAt).valueOf() > Date.now());
    if (validPlugins.length === 0) {
      validPlugins.push({
        expiredAt: new Date(new Date().setDate(new Date().getDate() + 7)),
        plugin: Plugin.Menu,
      } as any);
    }
    const renewAt = new Date(validPlugins[0].expiredAt);
    renewAt.setDate(renewAt.getDate() - 365);

    const region = shop.region
      ? await this.regionsRepository.findOneBy({ title: shop.region.title })
      : undefined;

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
      smsAccount,
      username: shop.username,
      region: region ? { id: region.id } : shop.region,
      phones: shop.phones,
      plugins: {
        plugins: validPlugins.map((x) => x.plugin),
        expiredAt: validPlugins[0].expiredAt,
        renewAt,
      },
      deliveryAreas,
      users,
    };

    const newShop = await this.shopsRepository.save(dto);

    if (shop.logo) {
      const savedImage: any = await this.filesService.uploadFromUrl(
        `http://65.21.237.12:3001/files/${shop.logo}`,
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
      await this.categoriesRepository.save(cat);

      if (cat.products) {
        for (const p of cat.products) {
          if (p.images && p.images[0]) {
            this.filesService
              .uploadFromUrl(`http://65.21.237.12:3001/files/${p.images[0]}`, p.title, shop.code)
              .then((savedImage: any) => {
                this.productsRepository
                  .update(p.id, {
                    images: [savedImage],
                  })
                  .catch((er) => {});
              });
          }
        }
      }
    }
    await this.shopsRepository.update(newShop.id, { menu: { id: newMenu.id } });

    const newAppConfig = await this.appConfigsRepository.save({
      disableOrdering: appConfig.viewMode,
      dings: appConfig.ding,
      ding: appConfig.ding?.length ? true : false,
      disableOrderingOnClose: appConfig.disableOrderingOutsideTime,
    });
    this.shopsRepository.update(newShop.id, { appConfig: { id: newAppConfig.id } });

    if (printViews) {
      printViews.forEach((pv) => {
        pv.printer.shop = { id: newShop.id } as any;
      });
      this.printViewsRepository.save(printViews);
    }

    if (newShop.plugins?.plugins.indexOf(Plugin.Club) > -1) {
      this.clubsService.syncClub(code).catch((er) => {});
    }

    return newShop;
  }
}

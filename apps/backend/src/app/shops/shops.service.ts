import {
  Club,
  CreateShopDto,
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
  ShopPlugins,
  Theme,
  OrderMessage,
  SmsTemplate,
  OrderMessageEvent,
  NewSmsDto,
  ThemeMode,
} from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { FilesService } from '../files/files.service';
import { ClubsService } from '../clubs/clubs.service';
import { MenusService } from '../menus/menu.service';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateObject, generateText } from 'ai';
import z from 'zod';

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
    private clubsService: ClubsService,
    private menusService: MenusService,
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
        tokens,
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
    let existUser: User;
    if (dto.loginUsername) {
      if (!Shop.isUsernameValid(dto.loginUsername))
        throw new HttpException({ loginUsername: 'the loginUsername is invalid' }, HttpStatus.NOT_ACCEPTABLE);
      existUser = await this.usersService.findOneByUsername(dto.loginUsername);
      if (existUser)
        throw new HttpException({ loginUsername: 'Duplicated Shop loginUsername' }, HttpStatus.CONFLICT);
    }

    if (dto.mobilePhone) {
      existUser = await this.usersService.findOneByMobilePhone(dto.mobilePhone);
      if (existUser && existUser.username)
        throw new HttpException({ mobilePhone: 'Duplicated Shop mobile phone' }, HttpStatus.CONFLICT);
    }

    if (dto.username) {
      if (!Shop.isUsernameValid(dto.username))
        throw new HttpException({ username: 'the username is invalid' }, HttpStatus.NOT_ACCEPTABLE);
      const existingShop = await this.shopsRepository.findOne({
        where: { username: dto.username.toLowerCase() },
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
    if (dto.username) shop.username = dto.username.toLowerCase();
    shop.title = dto.title;
    shop.code = code.toString();
    shop.businessCategory = dto.businessCategory;
    if (dto.customBusinessCategory) shop.customBusinessCategory = dto.customBusinessCategory;

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
      themeMode: ThemeMode.Dark,
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

    if (savedShopInfo && process.env.ADMIN_PHONE_NUMBERS) {
      try {
        const newTemplateSmsToAdmin = new NewSmsDto();
        newTemplateSmsToAdmin.messages = [
          `😍 مجموعه ${savedShopInfo.title} ایجاد شد\n\n${Shop.appLink(
            savedShopInfo,
            process.env.APP_ORIGIN,
          )}`,
        ];
        newTemplateSmsToAdmin.receptors = process.env.ADMIN_PHONE_NUMBERS.split(',');
        this.smsService.send(newTemplateSmsToAdmin);
      } catch (error) {}
    }

    return savedShopInfo;
  }

  async optimizeImages(code: string) {
    const shop = await this.shopsRepository.findOne({
      where: { code },
      relations: ['menu.categories.products'],
    });

    if (shop.logo) {
      try {
        const newImages = await this.filesService.getImgproxyLinks(shop.logo, 'logo', shop.code, true);
        await this.shopsRepository.save({ id: shop.id, logoImage: newImages });
      } catch (error) {}
    }

    if (shop.cover) {
      try {
        const newImages = await this.filesService.getImgproxyLinks(shop.cover, 'cover', shop.code, true);
        await this.shopsRepository.save({ id: shop.id, coverImage: newImages });
      } catch (error) {}
    }

    if (shop.verticalCover) {
      try {
        const newImages = await this.filesService.getImgproxyLinks(
          shop.verticalCover,
          'vertical_cover',
          shop.code,
          true,
        );
        await this.shopsRepository.save({ id: shop.id, verticalCoverImage: newImages });
      } catch (error) {}
    }

    if (shop.menu?.categories) {
      for (const cat of shop.menu.categories) {
        for (const prod of cat.products) {
          if (prod.images?.length) {
            try {
              const newImages = await this.filesService.getImgproxyLinks(
                prod.images[0],
                `product_${prod.id}`,
                shop.code,
                true,
              );
              await this.productsRepository.save({ id: prod.id, imageFiles: [newImages] });
            } catch (error) {
              // no need to handle
            }
          }
        }
      }
    }
  }

  async getSampleMenu(category: string) {
    const res = await generateObject({
      model: createOpenAICompatible({
        baseURL: process.env.AI_BASE_URL,
        name: 'example',
        apiKey: process.env.AI_API_KEY,
      }).chatModel('google/gemini-2.0-flash-001'),
      schema: z.object({
        categories: z.array(
          z.object({
            title: z.string(),
            products: z.array(z.object({ title: z.string(), description: z.string(), price: z.number() })),
          }),
        ),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'منو رو کامل از روی عکس بساز ا',
            },
            {
              type: 'image',
              image: new URL(
                'https://ashpazkhaneha.com/touraj/restaurant/tehrannorth/cafe-restaurant-amante-velenjak-tehran-tahdig-khoreshti08.jpg',
              ),
            },
          ],
        },
      ],
    });

    return res.object;
  }
}

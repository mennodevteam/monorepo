import { CreateShopDto, Plugin, Shop, ShopUserRole, Sms, User, UserRole } from '@menno/types';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { ShopsService } from './shops.service';
import { RedisKey, RedisService } from '../core/redis.service';

@Controller('shops')
export class ShopsController {
  constructor(
    private auth: AuthService,
    private shopsService: ShopsService,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private redis: RedisService,  
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  @Public()
  @Get('baseInfo')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  async shopInit(@Request() req: Request) {
    try {
      let shop: Shop;
      const referer: string = req.headers['referer'];
      const url = referer.split('://')[1];
      if (url.search(process.env.APP_ORIGIN.split('.')[0]) > -1) {
        const username = url.split('.')[0];
        shop = await this.shopsRepo.findOneBy({ username });
      } else {
        shop = await this.shopsRepo.findOneBy({
          domain: url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url,
        });
      }

      if (shop) {
        const logo = `https://${process.env.LIARA_BUCKET_NAME}.${process.env.LIARA_BUCKET_ENDPOINT}/${
          shop.logoImage?.sm || shop.logo
        }`;
        const title = shop.title;
        const description = shop.description;
        return { logo, title, description };
      }
    } catch (error) {}
    return;
  }

  @Public()
  @Get('baseInfo2/:origin')
  async shopInit2(@Request() req: Request) {
    try {
      let shop: Shop;
      const referer: string = req.headers['referer'];
      const url = referer.split('://')[1];
      if (url.search(process.env.APP_ORIGIN.split('.')[0]) > -1) {
        const username = url.split('.')[0];
        shop = await this.shopsRepo.findOneBy({ username });
      } else {
        shop = await this.shopsRepo.findOneBy({
          domain: url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url,
        });
      }

      if (shop) {
        const logo = `https://${process.env.LIARA_BUCKET_NAME}.${process.env.LIARA_BUCKET_ENDPOINT}/${
          shop.logoImage?.sm || shop.logo
        }`;
        const fav = `https://${process.env.LIARA_BUCKET_NAME}.${process.env.LIARA_BUCKET_ENDPOINT}/${
          shop.logoImage?.xxs || shop.logo
        }`;
        const title = shop.title;
        const description = shop.description;
        const seo = shop.seo;
        const scripts = shop.scripts;
        return { logo, title, description, seo, scripts, fav };
      }
    } catch (error) {}
    return;
  }

  @Public()
  @Get('manifest')
  async getManifest(@Request() req: Request) {
    try {
      let shop: Shop;
      const referer: string = req.headers['referer'];
      const url = referer.split('://')[1];
      if (url.search(process.env.APP_ORIGIN.split('.')[0]) > -1) {
        const username = url.split('.')[0];
        shop = await this.shopsRepo.findOneBy({ username });
      } else {
        shop = await this.shopsRepo.findOneBy({
          domain: url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url,
        });
      }

      if (shop) {
        return {
          name: shop.title,
          short_name: shop.title,
          // theme_color: theme,
          // background_color: themeBackground,
          // display: 'standalone',
          // scope: url,
          // start_url: url,
          // icons: manifestIcons,
        };
      }
    } catch (error) {}
    return {};
  }

  @Get()
  @Roles(UserRole.Panel, UserRole.Admin)
  async findOne(@LoginUser() user: AuthPayload): Promise<Shop | Shop[]> {
    if (user.role === UserRole.Panel) {
      const shop = await this.auth.getPanelUserShop(user, [
        'region',
        'appConfig.theme',
        'shopGroup',
        'club',
        'paymentGateway',
        'smsAccount',
        'plugins',
        'thirdParties',
      ]);
      this.shopsRepo.update(shop.id, { connectionAt: new Date() });
      return shop;
    } else {
      const shops = await this.shopsRepo.find({
        relations: ['region', 'plugins', 'users.user'],
        order: {
          createdAt: 'DESC',
        },
      });

      shops.forEach((shop) => {
        const admin = shop.users.find((x) => x.role === ShopUserRole.Admin);
        if (admin) shop.users = [admin];
      });

      return shops;
    }
  }

  @Public()
  @Get('sampleMenu')
  async getSampleMenu(@Query('category') category: string) {
    return this.shopsService.getSampleMenu(category);
  }

  @Put()
  @Roles(UserRole.Panel)
  async edit(@Body() dto: Shop, @LoginUser() user: AuthPayload): Promise<Shop> {
    const shop = await this.auth.getPanelUserShop(user);
    dto.id = shop.id;
    const res = await this.shopsService.save(dto);
    this.redis.updateShop(shop.id);
    return res;
  }

  @Post()
  @Roles(UserRole.Admin)
  async create(@Body() dto: CreateShopDto): Promise<Shop> {
    return this.shopsService.create(dto);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: CreateShopDto): Promise<Shop> {
    if (this.auth.checkToken(dto.mobilePhone, dto.otp)) {
      dto.plugins = [Plugin.Menu, Plugin.Ordering, Plugin.Club];
      dto.expiredAt = new Date();
      dto.pluginDescription = 'نسخه آزمایشی رایگان';
      dto.expiredAt.setDate(dto.expiredAt.getDate() + 3);
      return this.shopsService.create(dto);
    } else throw new HttpException({ otp: 'token invalid' }, HttpStatus.FORBIDDEN);
  }

  @Public()
  @Post('register/v2')
  async registerV2(@Body() dto: CreateShopDto): Promise<Shop> {
    return this.shopsService.create(dto);
  }

  @Get('sendLink/:mobile')
  @Roles(UserRole.Panel)
  async sendLink(@Param('mobile') mobile: string, @LoginUser() user: AuthPayload): Promise<Sms> {
    const shop = await this.auth.getPanelUserShop(user);
    return this.shopsService.sendShopLink(shop.id, mobile);
  }

  @Public()
  @Get(':query')
  async findByUsernameOrCode(@Param('query') query: string, @Req() req): Promise<Shop> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      select: ['id'],
    });
    if (shop) {
      const redisKey = this.redis.key(RedisKey.Shop, shop.id);
      let data = await this.redis.client.get(redisKey);
      if (!data) data = await this.redis.updateShop(shop.id);
      const res = JSON.parse(data);
      return res;
    }
    return;
  }

  @Public()
  @Get('optimizeImages/:code')
  async optimizeImages(@Param('code') code: string) {
    await this.shopsService.optimizeImages(code);
    const shop = await this.shopsRepo.findOne({
      where: { code },
    });
    this.redis.updateMenu(shop.id);
    this.redis.updateShop(shop.id);
  }
}

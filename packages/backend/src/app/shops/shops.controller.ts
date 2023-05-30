import { CreateShopDto, Plugin, Shop, ShopUserRole, Sms, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(
    private auth: AuthService,
    private shopsService: ShopsService,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
  ) {}

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
      return this.shopsRepo.find({
        relations: ['region', 'plugins', 'users.user'],
        where: {
          users: {
            role: ShopUserRole.Admin,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });
    }
  }

  @Put()
  @Roles(UserRole.Panel)
  async edit(@Body() dto: Shop, @LoginUser() user: AuthPayload): Promise<Shop> {
    const shop = await this.auth.getPanelUserShop(user);
    dto.id = shop.id;
    return this.shopsService.save(dto);
  }

  @Post()
  @Roles(UserRole.Admin)
  async create(@Body() dto: CreateShopDto): Promise<Shop> {
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
      relations: ['region', 'shopGroup', 'appConfig.theme', 'paymentGateway', 'plugins'],
    });

    if (!(shop.plugins?.plugins?.indexOf(Plugin.Ordering) >= 0)) shop.appConfig.disableOrdering = true;
    return shop;
  }

  @Public()
  @Get('createNewFromPrev/:code')
  createNewShopFromPrev(@Param('code') code: string): Promise<Shop> {
    return this.shopsService.createNewShopFromPrev(code);
  }
}

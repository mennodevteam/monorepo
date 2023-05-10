import { Plugin, Shop, Sms, UserRole } from '@menno/types';
import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
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
  @Roles(UserRole.Panel)
  findOne(@LoginUser() user: AuthPayload): Promise<Shop> {
    return this.auth.getPanelUserShop(user, [
      'region',
      'appConfig.theme',
      'shopGroup',
      'club',
      'smsAccount',
      'plugins',
      'thirdParties',
    ]);
  }

  @Put()
  @Roles(UserRole.Panel)
  async edit(@Body() dto: Shop, @LoginUser() user: AuthPayload): Promise<Shop> {
    const shop = await this.auth.getPanelUserShop(user);
    dto.id = shop.id;
    return this.shopsService.save(dto);
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

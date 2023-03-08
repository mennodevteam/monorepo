import { Shop, Sms } from '@menno/types';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Role } from '../core/types/role.enum';
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
  @Roles(Role.Panel)
  findOne(@LoginUser() user: AuthPayload): Promise<Shop> {
    return this.auth.getPanelUserShop(user, [
      'region',
      'appConfig.theme',
      'shopGroup',
      'menu.categories.products',
    ]);
  }

  @Put()
  @Roles(Role.Panel)
  async edit(@Body() dto: Shop, @LoginUser() user: AuthPayload): Promise<Shop> {
    const shop = await this.auth.getPanelUserShop(user);
    dto.id = shop.id;
    return this.shopsService.save(dto);
  }

  @Get('sendLink/:mobile')  
  @Roles(Role.Panel)
  async sendLink(@Param('mobile') mobile: string, @LoginUser() user: AuthPayload): Promise<Sms> {
    return this.shopsService.sendShopLink(user.shopId, mobile);
  }

  @Public()
  @Get(':query')
  findByUsernameOrCode(@Param('query') query: string): Promise<Shop> {
    return this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      relations: ['region', 'shopGroup', 'appConfig.theme', 'paymentGateway'],
    });
  }
}

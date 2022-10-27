import { Shop, Sms } from '@menno/types';
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorator';
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
    return this.auth.getPanelUserShop(user, ['region', 'shopGroup']);
  }

  @Put()
  @Roles(Role.Panel)
  async edit(@Body() dto: Shop, @LoginUser() user: AuthPayload): Promise<Shop> {
    dto.id = user.shopId;
    return this.shopsService.save(dto);
  }

  @Get('sendLink/:mobile')
  @Roles(Role.Panel)
  async sendLink(@Param('mobile') mobile: string, @LoginUser() user: AuthPayload): Promise<Sms> {
    return this.shopsService.sendShopLink(user.shopId, mobile);
  }

  @Get(':query')
  findByUsernameOrCode(@Param('query') query: string): Promise<Shop> {
    return this.shopsRepo.findOne({
      where: [{ username: query }, { code: query }],
      relations: ['region', 'shopGroup'],
    });
  }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorators';
import { Shop, ThirdParty, ThirdPartyApp, UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../core/redis.service';

@Roles(UserRole.Panel)
@Controller('thirdParties')
export class ThirdPartiesController {
  constructor(
    private auth: AuthService,
    private http: HttpService,
    @InjectRepository(ThirdParty)
    private repo: Repository<ThirdParty>,
    private redis: RedisService
  ) {}

  @Post()
  async save(@Body() dto: Partial<ThirdParty>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shop = { id: shop.id } as Shop;
    const res = await this.repo.save(dto);
    this.redis.updateShop(shop.id);
    return res;
  }
}

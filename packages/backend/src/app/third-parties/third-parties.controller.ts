import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.decorators';
import { Shop, ThirdParty, ThirdPartyApp, UserRole } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';

@Roles(UserRole.Panel)
@Controller('thirdParties')
export class ThirdPartiesController {
  constructor(
    private auth: AuthService,
    private http: HttpService,
    @InjectRepository(ThirdParty)
    private repo: Repository<ThirdParty>
  ) {}

  @Post()
  async save(@Body() dto: Partial<ThirdParty>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    dto.shop = { id: shop.id } as Shop;
    return this.repo.save(dto);
  }

  @Get('hami/syncMenu')
  async hamiSyncMenu(@LoginUser() user: AuthPayload, @Query('clear') clear: string) {
    const shop = await this.auth.getPanelUserShop(user, ['menu.categories.products']);
    const thirdParty = await this.repo.findOneBy({ app: ThirdPartyApp.Hami, shop: { id: shop.id } });
    if (thirdParty) {
      const groupResponse = await this.http
        .get(`${thirdParty.keys.apiPath}/HamiOrder/GetGoodsGroup.aspx?SecurityKey=${thirdParty.token}`)
        .toPromise();
      const goodResponse = await this.http
        .get(`${thirdParty.keys.apiPath}/HamiOrder/GetGoodsGroup.aspx?SecurityKey=${thirdParty.token}`)
        .toPromise();
    }
  }
}

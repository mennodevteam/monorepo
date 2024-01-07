import { Menu, Shop, Status } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { MenusService } from './menu.service';
import { RedisKey, RedisService } from '../core/redis.service';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private auth: AuthService,
    private menuService: MenusService,
    private redis: RedisService
  ) {}

  @Get()
  async getPanelMenu(@LoginUser() user: AuthPayload): Promise<Menu> {
    const shop = await this.auth.getPanelUserShop(user, [
      'menu.categories.products.variants',
      'menu.costs',
      'menu.costs.includeProductCategory',
      'menu.costs.includeProduct',
    ]);
    return shop.menu;
  }

  @Public()
  @Get('sync/:prevCode')
  async syncMenu(@Param('prevCode') prevCode: string) {
    const shop = await this.shopsRepo.findOne({
      where: { prevServerCode: prevCode },
      relations: ['menu'],
    });

    this.menuService.syncMenu(shop.menu.id, prevCode);
    this.redis.updateMenu(shop.id);
  }

  @Public()
  @Get(':query')
  async findOne(@Param('query') query: string): Promise<Menu> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      select: ['id']
    });

    if (shop) {
      const redisKey = this.redis.key(RedisKey.Menu, shop.id);
      let data = await this.redis.client.get(redisKey);
      if (!data) data = await this.redis.updateMenu(shop.id);
      const menu = JSON.parse(data);
      return menu;
    }
    return;
  }
}

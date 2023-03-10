import { Menu, Shop, Status } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { MenusService } from './menu.service';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private auth: AuthService,
    private menuService: MenusService
  ) {}

  @Public()
  @Get(':query')
  async findOne(@Param('query') query: string): Promise<Menu> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      relations: [
        'menu.categories.products',
        'menu.costs',
        'menu.costs.includeProductCategory',
        'menu.costs.includeProduct',
      ],
    });

    if (shop.menu?.costs) shop.menu.costs = shop.menu.costs.filter((x) => x.status === Status.Active);

    return shop.menu;
  }

  @Get()
  async getPanelMenu(@LoginUser() user: AuthPayload): Promise<Menu> {
    const shop = await this.auth.getPanelUserShop(user, [
      'menu.categories.products',
      'menu.costs',
      'menu.costs.includeProductCategory',
      'menu.costs.includeProduct',
    ]);
    console.log(shop);
    return shop.menu;
  }

  @Get('sync/:prevCode')
  async syncMenu(@LoginUser() user: AuthPayload, @Param('prevCode') prevCode: string) {
    const shop = await this.auth.getPanelUserShop(user, [
      'menu.categories.products',
      'menu.costs',
      'menu.costs.includeProductCategory',
      'menu.costs.includeProduct',
    ]);

    this.menuService.syncMenu(shop.menu.id, prevCode);
  }
}

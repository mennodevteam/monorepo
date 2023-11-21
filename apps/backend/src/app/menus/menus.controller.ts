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
  }

  @Public()
  @Get(':query')
  async findOne(@Param('query') query: string): Promise<Menu> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      relations: [
        'menu.categories.products.variants',
        'menu.costs',
        'menu.costs.includeProductCategory',
        'menu.costs.includeProduct',
      ],
    });

    if (shop.menu?.costs) shop.menu.costs = shop.menu.costs.filter((x) => x.status !== Status.Inactive);
    if (shop.menu?.categories) {
      shop.menu.categories = shop.menu.categories.filter((x) => x.status !== Status.Inactive);
      for (const cat of shop.menu.categories) {
        if (cat.products) {
          cat.products = cat.products.filter((x) => x.status !== Status.Inactive);
          for (const product of cat.products) {
            if (product.variants) product.variants = product.variants.filter((x) => x.status !== Status.Inactive);
          }
        }
      }
    }

    return shop.menu;
  }
}

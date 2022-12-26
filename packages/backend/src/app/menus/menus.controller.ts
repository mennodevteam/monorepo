import { Menu, Shop } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    private auth: AuthService
  ) {}

  @Public()
  @Get(':query')
  async findOne(@Param('query') query: string): Promise<Menu> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      relations: ['menu.categories.products', 'menu.costs'],
    });

    return shop.menu;
  }

  @Get()
  async getPanelMenu(@LoginUser() user: AuthPayload): Promise<Menu> {
    const shop = await this.auth.getPanelUserShop(user, ['menu.categories.products', 'menu.costs']);
    return shop.menu;
  }
}

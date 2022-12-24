import { Menu, Shop } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
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
}

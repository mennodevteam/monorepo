import { Menu } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('menus')
export class MenusController {
  constructor(
    @InjectRepository(Menu)
    private menusRepo: Repository<Menu>
  ) {}

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Menu> {
    return this.menusRepo.findOne({
      where: { id },
      relations: ['categories', 'categories.products', 'costs'],
      order: {
        categories: {
          position: 'ASC',
          createdAt: 'ASC',
          products: {
            position: 'ASC',
            createdAt: 'ASC',
          },
        },
      },
    });
  }
}

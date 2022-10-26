import { ProductCategory } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../core/types/role.enum';
import { MenusService } from './menu.service';

@Controller('product-categories')
@Roles(Role.Panel)
export class ProductCategoriesController {
  constructor(
    private menuService: MenusService,
    @InjectRepository(ProductCategory)
    private categoriesRepo: Repository<ProductCategory>
  ) {}

  @Post()
  save(@Body() dto: ProductCategory): Promise<ProductCategory> {
    return this.categoriesRepo.save(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoriesRepo.delete({ id: Number(id) });
  }

  @Post('sort')
  sort(@Body() list: number[]): Promise<ProductCategory[]> {
    return this.menuService.sortProductCategories(list);
  }
}

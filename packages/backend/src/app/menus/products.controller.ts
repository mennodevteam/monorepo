import { Product, UserRole } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { MenusService } from './menu.service';

@Controller('products')
@Roles(UserRole.Panel)
export class ProductsController {
  constructor(
    private menuService: MenusService,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>
  ) {}

  @Post()
  save(@Body() dto: Product): Promise<Product> {
    return this.productsRepo.save(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsRepo.delete({ id });
  }

  @Post('sort')
  sort(@Body() list: string[]): Promise<Product[]> {
    return this.menuService.sortProducts(list);
  }
}

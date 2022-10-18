import { ProductCategory } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductCategoriesService } from './product-categories.service';

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private categoriesService: ProductCategoriesService) {}

  @MessagePattern('productCategories/findOne')
  findOne(id: number): Promise<ProductCategory> {
    return this.categoriesService.findOne(id);
  }

  @MessagePattern('productCategories/save')
  save(dto: ProductCategory): Promise<ProductCategory> {
    return this.categoriesService.save(dto);
  }

  @MessagePattern('productCategories/remove')
  remove(id: number): Promise<void> {
    return this.categoriesService.remove(id);
  }

  @MessagePattern('product-categories/sort')
  async sort(@Payload() list: number[]): Promise<ProductCategory[]> {
    return await this.categoriesService.sort(list);
  }
}

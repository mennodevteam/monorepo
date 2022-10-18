import { FilterProduct, Product } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @MessagePattern('products/findOne')
  findOne(id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @MessagePattern('products/save')
  save(dto: Product): Promise<Product> {
    return this.productsService.save(dto);
  }

  @MessagePattern('products/remove')
  remove(id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  @MessagePattern('products/sort')
  async sort(@Payload() list: string[]): Promise<Product[]> {
    return await this.productsService.sort(list);
  }

  @MessagePattern('products/filter')
  filter(FilterProduct: FilterProduct) {
    return this.productsService.filter(FilterProduct);
  }

  @MessagePattern('products/findAllPackItems')
  findAllPackItems(dto: { packItems: string[] }): Promise<Product[]> {
    return this.productsService.findAllPackItems(dto);
  }
}

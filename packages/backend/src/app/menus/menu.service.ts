import { Product, ProductCategory } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoriesRepo: Repository<ProductCategory>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>
  ) {}

  async sortProductCategories(list: number[]) {
    const categories: ProductCategory[] = [];
    for (let i = 0; i < list.length; i++) {
      categories.push(<ProductCategory>{
        id: <any>list[i],
        position: i,
      });
    }
    return await this.categoriesRepo.save(categories);
  }

  async sortProducts(list: string[]) {
    const products: Product[] = [];
    for (let i = 0; i < list.length; i++) {
      products.push(<Product>{
        id: list[i],
        position: i,
      });
    }

    return await this.productsRepo.save(products);
  }
}

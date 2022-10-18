import { ProductCategory } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>
  ) {}

  findOne(id: number): Promise<ProductCategory> {
    return this.categoriesRepository.findOne({ where: { id } });
  }

  save(dto: ProductCategory): Promise<ProductCategory> {
    return this.categoriesRepository.save(dto);
  }

  async remove(id: number): Promise<void> {
    await this.categoriesRepository.softDelete(id);
  }

  async sort(list: number[]): Promise<ProductCategory[]> {
    const categories: ProductCategory[] = [];
    for (let i = 0; i < list.length; i++) {
      categories.push(<ProductCategory>{
        id: list[i],
        position: i,
      });
    }
    return await this.categoriesRepository.save(categories);
  }
}

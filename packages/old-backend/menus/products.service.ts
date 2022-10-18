import { FilterProduct, Product, Shop } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindManyOptions,
  FindOptionsWhere,
  Like,
  Repository,
} from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>
  ) {}

  findOne(id: string): Promise<Product> {
    return this.productsRepository.findOne({ where: { id } });
  }

  save(dto: Product): Promise<Product> {
    return this.productsRepository.save(dto);
  }

  async remove(id: string): Promise<void> {
    await this.productsRepository.softDelete(id);
  }

  async sort(list: string[]) {
    const products: Product[] = [];
    for (let i = 0; i < list.length; i++) {
      products.push(<Product>{
        id: list[i],
        position: i,
      });
    }

    return await this.productsRepository.save(products);
  }

  async filter(
    filterProduct: FilterProduct
  ): Promise<{ data: Product[]; count: number }> {
    const options: FindOptionsWhere<Product> = {};
    const otherOptions: FindManyOptions<FilterProduct> = {};

    if (filterProduct.title) options.title = Like(`%${filterProduct.title}%`);
    if (filterProduct.take) otherOptions.take = filterProduct.take;
    if (filterProduct.skip) otherOptions.skip = filterProduct.skip;
    const [products, total] = await this.productsRepository.findAndCount({
      where: options,
      take: otherOptions.take,
      skip: otherOptions.skip,
      relations: ['category', 'category.menu'],
    });

    return {
      data: products,
      count: total,
    };
  }

  async findAllPackItems(dto: { packItems: string[] }): Promise<Product[]> {
    const packItemsIds = dto.packItems;
    console.log(packItemsIds);
    const product = await this.productsRepository
      .createQueryBuilder('Product')
      .leftJoinAndSelect('Product.category', 'category')
      .leftJoinAndSelect('category.menu', 'menu')
      .where('Product.packItems && :packItemsIds::varchar[]', { packItemsIds })
      .getMany();
    console.log(product);
    return product;
  }
}

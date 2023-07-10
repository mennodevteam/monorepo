import { Shop, ShopGroup } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('shopGroups')
export class ShopGroupsController {
  constructor(
    @InjectRepository(ShopGroup)
    private shopGroupsRepo: Repository<ShopGroup>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>
  ) {}

  @Get(':query')
  async findByCode(@Param('query') query: string): Promise<ShopGroup> {
    const shop = await this.shopsRepo.findOne({
      where: [{ domain: query }, { username: query }, { code: query }],
      relations: ['shopGroup.shops'],
    });
    return shop?.shopGroup;
  }
}

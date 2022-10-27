import { ShopGroup } from '@menno/types';
import { Controller, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('shopGroups')
export class ShopGroupsController {
  constructor(
    @InjectRepository(ShopGroup)
    private shopGroupsRepo: Repository<ShopGroup>
  ) {}

  @Get(':query')
  findByCode(@Param('query') query: string): Promise<ShopGroup> {
    return this.shopGroupsRepo.findOne({
      where: [{ code: query }],
      relations: ['shops'],
    });
  }
}

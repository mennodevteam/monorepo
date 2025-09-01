import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillOfProduct } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('materials/bops')
export class BopsController {
  constructor(
    @InjectRepository(BillOfProduct)
    private readonly bopRepository: Repository<BillOfProduct>,
    private auth: AuthService,
  ) {}

  @Post()
  async create(@Body() data: Partial<BillOfProduct>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    console.log(data);
    return this.bopRepository.save({ ...data, shop: { id: shop.id } });
  }

  @Get()
  async findAll(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.bopRepository.find({
      where: {
        shop: { id: shop.id },
      },
      relations: ['productSource', 'variantSource', 'product', 'variant'],
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    return this.bopRepository.delete(id);
  }
}

import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillOfMaterial } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('materials/boms')
export class BomsController {
  constructor(
    @InjectRepository(BillOfMaterial)
    private readonly bomRepository: Repository<BillOfMaterial>,
    private auth: AuthService,
  ) {}

  @Post()
  async create(@Body() data: Partial<BillOfMaterial>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.bomRepository.save({ ...data, shop: { id: shop.id } });
  }

  @Get()
  async findAll(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.bomRepository.find({
      where: {
        material: {
          shop: { id: shop.id },
        },
      },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    return this.bomRepository.delete(id);
  }
}

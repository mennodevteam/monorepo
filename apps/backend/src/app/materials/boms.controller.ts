import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillOfMaterial } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('materials/boms')
export class BomsController {
  constructor(
    @InjectRepository(BillOfMaterial)
    private readonly bomRepository: Repository<BillOfMaterial>,
  ) {}

  @Post()
  create(@Body() data: Partial<BillOfMaterial>, @LoginUser() user: AuthPayload) {
    // Optionally, you can check user.shopId for access control if needed
    return this.bomRepository.save(data);
  }

  @Get()
  findAll(@Query('productId') productId?: string, @Query('variantId') variantId?: string) {
    const where: any = {};
    if (productId) where.product = { id: productId };
    if (variantId) where.variant = { id: variantId };
    return this.bomRepository.find({ where });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<BillOfMaterial>, @LoginUser() user: AuthPayload) {
    return this.bomRepository.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    return this.bomRepository.delete(id);
  }
} 
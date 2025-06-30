import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';

@Controller('materials')
export class MaterialsController {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  @Post()
  create(@Body() data: Partial<Material>, @LoginUser() user: AuthPayload) {
    return this.materialRepository.save({ ...data, shop: { id: user.shopId } });
  }

  @Get()
  findAll(@LoginUser() user: AuthPayload) {
    return this.materialRepository.find({ where: { shop: { id: user.shopId } } });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    return this.materialRepository.delete({ id, shop: { id: user.shopId } });
  }
}

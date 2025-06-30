import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '@menno/types';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('materials')
export class MaterialsController {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    private auth: AuthService,
  ) {}

  @Post()
  async create(@Body() data: Partial<Material>, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return await this.materialRepository.save({ ...data, shop });
  }

  @Get()
  async findAll(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.materialRepository.find({ where: { shop: { id: shop.id } } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    return this.materialRepository.delete({ id, shop });
  }
}

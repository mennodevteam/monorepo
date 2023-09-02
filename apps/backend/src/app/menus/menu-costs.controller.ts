import { MenuCost, UserRole } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';

@Controller('menuCosts')
@Roles(UserRole.Panel)
export class MenuCostsController {
  constructor(
    @InjectRepository(MenuCost)
    private menuCostsRepo: Repository<MenuCost>
  ) {}

  @Post()
  save(@Body() dto: MenuCost): Promise<MenuCost> {
    return this.menuCostsRepo.save(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.menuCostsRepo.delete(Number(id));
  }
}

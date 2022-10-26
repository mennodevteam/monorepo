import { MenuCost } from '@menno/types';
import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../core/types/role.enum';

@Controller('menu-costs')
@Roles(Role.Panel)
export class MenuCostsController {
  constructor(
    @InjectRepository(MenuCost)
    private menuCostsRepo: Repository<MenuCost>
  ) {}

  @Post()
  save(dto: MenuCost): Promise<MenuCost> {
    return this.menuCostsRepo.save(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.menuCostsRepo.delete(Number(id));
  }
}

import { MenuCost } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCostSchema } from './schemas/menu-cost.schema';

@Injectable()
export class MenuCostsService {
  constructor(
    @InjectRepository(MenuCostSchema)
    private menuCostsRepository: Repository<MenuCost>
  ) {}

  findOne(menuId: string): Promise<MenuCost[]> {
    return this.menuCostsRepository.find({ where: { menu: { id: menuId } } });
  }

  save(dto: MenuCost): Promise<MenuCost> {
    return this.menuCostsRepository.save(dto);
  }

  async remove(id: number): Promise<void> {
    await this.menuCostsRepository.delete(id);
  }
}

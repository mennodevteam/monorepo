import { MenuCost } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MenuCostsService } from './menu-costs.service';

@Controller('menu-costs')
export class MenuCostsController {
  constructor(private menuCostsService: MenuCostsService) {}

  @MessagePattern('menuCosts/findOne')
  findOne(menuId: string): Promise<MenuCost[]> {
    return this.menuCostsService.findOne(menuId);
  }

  @MessagePattern('menuCosts/save')
  save(dto: MenuCost): Promise<MenuCost> {
    return this.menuCostsService.save(dto);
  }

  @MessagePattern('menuCosts/remove')
  remove(id: number): Promise<void> {
    return this.menuCostsService.remove(id);
  }
}

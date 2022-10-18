import { Menu } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  @MessagePattern('menus/findOne')
  findOne(id: string): Promise<Menu> {
    return this.menusService.findOne(id);
  }
}

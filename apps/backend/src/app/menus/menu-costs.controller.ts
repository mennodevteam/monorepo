import { MenuCost, UserRole } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { RedisService } from '../core/redis.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('menuCosts')
@Roles(UserRole.Panel)
export class MenuCostsController {
  constructor(
    @InjectRepository(MenuCost)
    private menuCostsRepo: Repository<MenuCost>,
    private redis: RedisService,
    private auth: AuthService,
  ) {}

  @Post()
  async save(@Body() dto: MenuCost, @LoginUser() user: AuthPayload): Promise<MenuCost> {
    const shop = await this.auth.getPanelUserShop(user);
    const res = await this.menuCostsRepo.save(dto);
    this.redis.updateMenu(shop.id);
    return res;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    const shop = await this.auth.getPanelUserShop(user);
    await this.menuCostsRepo.delete(Number(id));
    this.redis.updateMenu(shop.id);
  }
}

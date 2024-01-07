import { Product, UserRole } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { MenusService } from './menu.service';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../core/redis.service';
import { AuthPayload } from '../core/types/auth-payload';
import { LoginUser } from '../auth/user.decorator';

@Controller('products')
@Roles(UserRole.Panel)
export class ProductsController {
  constructor(
    private menuService: MenusService,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    private auth: AuthService,
    private redis: RedisService
  ) {}

  @Post()
  async save(@Body() dto: Product, @LoginUser() user: AuthPayload): Promise<Product> {
    const shop = await this.auth.getPanelUserShop(user);
    const res = await this.productsRepo.save(dto);
    this.redis.updateMenu(shop.id);
    return res;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    const shop = await this.auth.getPanelUserShop(user);
    await this.productsRepo.softDelete({ id });
    this.redis.updateMenu(shop.id);
  }

  @Post('sort')
  async sort(@Body() list: string[], @LoginUser() user: AuthPayload): Promise<Product[]> {
    const shop = await this.auth.getPanelUserShop(user);
    const res = await this.menuService.sortProducts(list);
    this.redis.updateMenu(shop.id);
    return res;
  }
}

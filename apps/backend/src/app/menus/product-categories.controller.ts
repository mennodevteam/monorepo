import { ProductCategory, UserRole } from '@menno/types';
import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { MenusService } from './menu.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../core/redis.service';

@Controller('productCategories')
@Roles(UserRole.Panel)
export class ProductCategoriesController {
  constructor(
    private menuService: MenusService,
    @InjectRepository(ProductCategory)
    private categoriesRepo: Repository<ProductCategory>,
    private auth: AuthService,
    private redis: RedisService
  ) {}

  @Post()
  async save(@Body() dto: ProductCategory, @LoginUser() user: AuthPayload): Promise<ProductCategory> {
    const shop = await this.auth.getPanelUserShop(user);
    const res = await this.categoriesRepo.save(dto);
    this.redis.updateMenu(shop.id);
    return res;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @LoginUser() user: AuthPayload): Promise<void> {
    const shop = await this.auth.getPanelUserShop(user);
    await this.categoriesRepo.softDelete({ id: Number(id) });
    this.redis.updateMenu(shop.id);
  }

  @Post('sort')
  async sort(@Body() list: number[], @LoginUser() user: AuthPayload): Promise<ProductCategory[]> {
    const shop = await this.auth.getPanelUserShop(user);
    const res = await this.menuService.sortProductCategories(list);
    this.redis.updateMenu(shop.id);
    return res;
  }
}

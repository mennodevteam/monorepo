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

    const newRelatedIds = (dto.relatedProductIds ?? []).filter((id): id is string => !!id);
    const currentProductId = dto.id;

    if (currentProductId) {
      const existing = await this.productsRepo.findOne({
        where: { id: currentProductId },
        select: ['id', 'relatedProductIds'],
      });
      const oldRelatedIds: string[] = (existing?.relatedProductIds ?? []) as string[];

      const added = newRelatedIds.filter((id) => !oldRelatedIds.includes(id));
      const removed = oldRelatedIds.filter((id) => !newRelatedIds.includes(id));

      for (const relatedId of added) {
        const other = await this.productsRepo.findOne({ where: { id: relatedId } });
        if (other) {
          const othersRelated = ((other.relatedProductIds ?? []) as string[]).filter(Boolean);
          if (!othersRelated.includes(currentProductId)) {
            other.relatedProductIds = [...othersRelated, currentProductId];
            await this.productsRepo.save(other);
          }
        }
      }

      for (const relatedId of removed) {
        const other = await this.productsRepo.findOne({ where: { id: relatedId } });
        if (other) {
          const othersRelated = ((other.relatedProductIds ?? []) as string[]).filter(Boolean);
          other.relatedProductIds = othersRelated.filter((id) => id !== currentProductId);
          await this.productsRepo.save(other);
        }
      }
    }

    const res = await this.productsRepo.save(dto);
    await this.redis.updateMenu(shop.id);
    return res;
  }

  @Post('array')
  async saveArray(@Body() dto: Product[], @LoginUser() user: AuthPayload): Promise<Product[]> {
    const shop = await this.auth.getPanelUserShop(user, ['menu']);
    for (const d of dto) {
      if (!d.category.id) d.category.menu = shop.menu;
    }
    const res = await this.productsRepo.save(dto);
    await this.redis.updateMenu(shop.id);
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
    await this.redis.updateMenu(shop.id);
    return res;
  }
}

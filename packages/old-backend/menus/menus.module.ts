import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { ProductsController } from './products.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { ProductsService } from './products.service';
import { MenuCostsController } from './menu-costs.controller';
import { MenuCostsService } from './menu-costs.service';
import { MenuCostSchema } from './schemas/menu-cost.schema';
import { MenuSchema } from './schemas/menu.schema';
import { ProductCategorySchema } from './schemas/product-category.schema';
import { ProductSchema } from './schemas/product.schema';
import { ShopSchema } from '../shops/schemas/shop.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuCostSchema,
      MenuSchema,
      ProductCategorySchema,
      ProductSchema,
      ShopSchema,
    ]),
  ],
  providers: [
    MenusService,
    ProductCategoriesService,
    ProductsService,
    MenuCostsService,
  ],
  controllers: [
    MenusController,
    ProductsController,
    ProductCategoriesController,
    MenuCostsController,
  ],
  exports: [MenusService],
})
export class MenusModule {}

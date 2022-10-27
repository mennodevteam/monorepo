import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusController } from './menus.controller';
import { ProductsController } from './products.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { MenuCostSchema, MenuSchema, ProductCategorySchema, ProductSchema } from './schemas';
import { MenusService } from './menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCostSchema, MenuSchema, ProductCategorySchema, ProductSchema])],
  providers: [MenusService],
  controllers: [MenusController, ProductsController, ProductCategoriesController],
})
export class MenusModule {}

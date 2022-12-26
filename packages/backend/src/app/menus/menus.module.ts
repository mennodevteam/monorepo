import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { ProductsController } from './products.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { MenusService } from './menu.service';
import { SchemasModule } from '../core/schemas.module';
import { AuthModule } from '../auth/auth.module';
import { MenuCostsController } from './menu-costs.controller';

@Module({
  imports: [SchemasModule, AuthModule],
  providers: [MenusService],
  controllers: [
    MenusController,
    ProductsController,
    ProductCategoriesController,
    MenuCostsController,
  ],
})
export class MenusModule {}

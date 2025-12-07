import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { ProductsController } from './products.controller';
import { ProductCategoriesController } from './product-categories.controller';
import { MenusService } from './menu.service';
import { CoreModule } from '../core/core.module';
import { AuthModule } from '../auth/auth.module';
import { MenuCostsController } from './menu-costs.controller';
import { HttpModule } from '@nestjs/axios';
import { FilesModule } from '../files/files.module';
import { MenuStatsController } from './menu-stats.controller';
import { MenuStatsSubscriber } from './menu-stats.subscriber';

@Module({
  imports: [CoreModule, AuthModule, HttpModule, FilesModule],
  providers: [MenusService, MenuStatsSubscriber],
  controllers: [
    MenusController,
    ProductsController,
    ProductCategoriesController,
    MenuCostsController,
    MenuStatsController,
  ],
  exports: [MenusService]
})
export class MenusModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopPluginSchema } from './schemas/shop-plugin.schema';
import { ShopPluginsController } from './shop-plugins.controller';
import { ShopPluginsService } from './shop-plugins.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShopPluginSchema])],
  providers: [ShopPluginsService],
  controllers: [ShopPluginsController],
  exports: [ShopPluginsService],
})
export class PluginsModule {}

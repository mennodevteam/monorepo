import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { ShopPluginsController } from './shop-plugins.controller';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [ShopPluginsController],
})
export class ShopPluginsModule {}

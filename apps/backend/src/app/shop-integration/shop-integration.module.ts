import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { OrdersModule } from '../orders/orders.module';
import { ShopIntegrationController } from './shop-integration.controller';
import { ShopIntegrationService } from './shop-integration.service';

@Module({
  imports: [CoreModule, OrdersModule],
  controllers: [ShopIntegrationController],
  providers: [ShopIntegrationService],
  exports: [ShopIntegrationService],
})
export class ShopIntegrationModule {}

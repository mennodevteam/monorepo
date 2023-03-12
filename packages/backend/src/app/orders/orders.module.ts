import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { OrderSubscriber } from './order.subscriber';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [SchemasModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSubscriber],
  exports: [OrdersService],
})
export class OrdersModule {}

import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentGatewaysController } from './payment-gateways.controller';

@Module({
  imports: [SchemasModule, HttpModule, OrdersModule, AuthModule],
  controllers: [PaymentsController, PaymentGatewaysController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

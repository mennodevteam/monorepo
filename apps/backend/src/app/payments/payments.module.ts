import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentGatewaysController } from './payment-gateways.controller';

@Module({
  imports: [CoreModule, HttpModule, OrdersModule, AuthModule],
  controllers: [PaymentsController, PaymentGatewaysController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

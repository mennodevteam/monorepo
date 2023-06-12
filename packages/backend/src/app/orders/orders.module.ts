import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchemasModule } from '../core/schemas.module';
import { OrderSubscriber } from './order.subscriber';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SmsModule } from '../sms/sms.module';
import { WebPushNotificationModule } from '../web-push-notifications/web-push-notifications.module';

@Module({
  imports: [SchemasModule, AuthModule, SmsModule, WebPushNotificationModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderSubscriber],
  exports: [OrdersService],
})
export class OrdersModule {}

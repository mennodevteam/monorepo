import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoreModule } from '../core/core.module';
import { OrdersSubscriber } from './orders.subscriber';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SmsModule } from '../sms/sms.module';
import { WebPushNotificationModule } from '../web-push-notifications/web-push-notifications.module';
import { PrintersModule } from '../printers/printers.module';
import { ClubsModule } from '../clubs/clubs.module';
import { OrderItemsSubscriber } from './order-items.subscriber';
import { RedisService } from '../core/redis.service';

@Module({
  imports: [CoreModule, AuthModule, SmsModule, WebPushNotificationModule, PrintersModule, ClubsModule],
  controllers: [OrdersController],
  providers: [OrdersService, RedisService, OrdersSubscriber, OrderItemsSubscriber],
  exports: [OrdersService],
})
export class OrdersModule {}

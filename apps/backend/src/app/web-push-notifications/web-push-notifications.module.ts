import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { WebPushNotificationsService } from './web-push-notifications.service';
import { WebPushNotificationsController } from './web-push-notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreModule, AuthModule],
  providers: [WebPushNotificationsService],
  controllers: [WebPushNotificationsController],
  exports: [WebPushNotificationsService],
})
export class WebPushNotificationModule {}

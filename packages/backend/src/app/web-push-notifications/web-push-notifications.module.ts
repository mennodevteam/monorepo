import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';
import { WebPushNotificationsService } from './web-push-notifications.service';

@Module({
  imports: [SchemasModule],
  providers: [WebPushNotificationsService],
  controllers: [],
  exports: [WebPushNotificationsService]
})
export class WebPushNotificationModule {}

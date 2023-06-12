import { Module } from '@nestjs/common';
import { SchemasModule } from '../core/schemas.module';
import { WebPushNotificationsService } from './web-push-notifications.service';
import { WebPushNotificationsController } from './web-push-notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SchemasModule, AuthModule],
  providers: [WebPushNotificationsService],
  controllers: [WebPushNotificationsController],
  exports: [WebPushNotificationsService],
})
export class WebPushNotificationModule {}

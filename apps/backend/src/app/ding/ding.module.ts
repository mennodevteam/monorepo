import { Module } from '@nestjs/common';
import { DingController } from './ding.controller';
import { CoreModule } from '../core/core.module';
import { WebPushNotificationModule } from '../web-push-notifications/web-push-notifications.module';

@Module({
  imports: [CoreModule, WebPushNotificationModule],
  providers: [],
  controllers: [DingController],
})
export class DingModule {}

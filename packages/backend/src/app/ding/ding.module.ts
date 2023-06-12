import { Module } from '@nestjs/common';
import { DingController } from './ding.controller';
import { SchemasModule } from '../core/schemas.module';
import { WebPushNotificationModule } from '../web-push-notifications/web-push-notifications.module';

@Module({
  imports: [SchemasModule, WebPushNotificationModule],
  providers: [],
  controllers: [DingController],
})
export class DingModule {}

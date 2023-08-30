import { Module } from '@nestjs/common';
import { WindowsLocalNotificationController } from './windows-local-notification.controller';
import { WindowsLocalNotificationService } from './windows-local-notification.service';
import { SchemasModule } from '../core/schemas.module';

@Module({
  imports: [SchemasModule],
  providers: [WindowsLocalNotificationService],
  controllers: [WindowsLocalNotificationController],
  exports: [WindowsLocalNotificationService],
})
export class WindowsLocalNotificationModule {}

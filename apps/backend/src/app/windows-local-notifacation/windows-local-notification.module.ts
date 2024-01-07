import { Module } from '@nestjs/common';
import { WindowsLocalNotificationController } from './windows-local-notification.controller';
import { WindowsLocalNotificationService } from './windows-local-notification.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [WindowsLocalNotificationService],
  controllers: [WindowsLocalNotificationController],
  exports: [WindowsLocalNotificationService],
})
export class WindowsLocalNotificationModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WindowsLocalNotificationSchema } from './entities/schemas/windows-local-notification.schema';
import { WindowsLocalNotificationController } from './windows-local-notification.controller';
import { WindowsLocalNotificationService } from './windows-local-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([WindowsLocalNotificationSchema])],
  providers: [WindowsLocalNotificationService],
  controllers: [WindowsLocalNotificationController],
  exports: [WindowsLocalNotificationService],
})
export class WindowsLocalNotificationModule {}

import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { PanelNotificationsController } from './panel-notifications.controller';
import { PanelNotificationsService } from './panel-notifications.service';

@Module({
  imports: [CoreModule],
  controllers: [PanelNotificationsController],
  providers: [PanelNotificationsService],
  exports: [PanelNotificationsService],
})
export class PanelNotificationsModule {}

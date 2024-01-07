import { Controller, Get, Param } from '@nestjs/common';
import { WindowsLocalNotificationService } from './windows-local-notification.service';
import { WindowsLocalNotification } from '@menno/types';
import { Public } from '../auth/public.decorator';

@Controller('windowsNotifications')
export class WindowsLocalNotificationController {
  constructor(private widowsLocalNotificationService: WindowsLocalNotificationService) {}

  @Public()
  @Get('/:shopId')
  async getNewNotifies(@Param('shopId') shopId: string): Promise<WindowsLocalNotification[]> {
    const notifications = await this.widowsLocalNotificationService.findByShop(shopId);
    return notifications;
  }

  @Public()
  @Get('/isNotified/:id')
  async isNotified(@Param('id') id: string): Promise<void> {
    // return this.widowsLocalNotificationService.isNotified(Number(id));
  }

  @Public()
  @Get('/setFailed/:id')
  async setFailed(@Param('id') id: string): Promise<void> {
    // return this.widowsLocalNotificationService.setFailed(Number(id));
  }
}

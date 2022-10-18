import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WindowsLocalNotification } from './entities/windows-local-notification';
import { WindowsLocalNotificationService } from './windows-local-notification.service';

@Controller()
export class WindowsLocalNotificationController {
  constructor(
    private widowsLocalNotificationService: WindowsLocalNotificationService
  ) {}

  @MessagePattern('windowsLocalNotification/save')
  save(dto: WindowsLocalNotification): Promise<WindowsLocalNotification> {
    return this.widowsLocalNotificationService.save(dto);
  }
  @MessagePattern('windowsLocalNotification/get')
  getNewNotifiesByShop(shopId: string): Promise<WindowsLocalNotification[]> {
    return this.widowsLocalNotificationService.findByShop(shopId);
  }
  @MessagePattern('windowsLocalNotification/isNotified')
  isNotified(id: number): Promise<void> {
    return this.widowsLocalNotificationService.isNotified(id);
  }

  @MessagePattern('windowsLocalNotification/setFailed')
  setFailed(id: number): Promise<void> {
    return this.widowsLocalNotificationService.setFailed(id);
  }
}

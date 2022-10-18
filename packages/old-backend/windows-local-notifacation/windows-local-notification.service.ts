import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { WindowsLocalNotificationSchema } from './entities/schemas/windows-local-notification.schema';
import { WindowsLocalNotification } from './entities/windows-local-notification';

@Injectable()
export class WindowsLocalNotificationService {
  constructor(
    @InjectRepository(WindowsLocalNotification)
    private windowsLocalNotificationRepository: Repository<WindowsLocalNotification>
  ) {}

  save(dto: WindowsLocalNotification): Promise<WindowsLocalNotification> {
    return this.windowsLocalNotificationRepository.save(dto);
  }
  async findByShop(shopId: string): Promise<WindowsLocalNotification[]> {
    const last5min = new Date();
    last5min.setMinutes(last5min.getMinutes() - 5);
    let windowsNotifies = await this.windowsLocalNotificationRepository.find({
      where: {
        shop: shopId,
        isNotified: false,
        failedCount: 0,
        createdAt: MoreThanOrEqual(last5min),
      },
      order: {
        createdAt: 'DESC',
      },
    });
    return windowsNotifies;
  }

  async isNotified(id: number): Promise<void> {
    await this.windowsLocalNotificationRepository.update(id, {
      isNotified: true,
    });
  }

  async setFailed(id: number): Promise<void> {
    this.windowsLocalNotificationRepository.increment(
      { id: id },
      'failedCount',
      1
    );
  }
}

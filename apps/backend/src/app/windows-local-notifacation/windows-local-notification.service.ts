import { WindowsLocalNotification } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class WindowsLocalNotificationService {
  constructor(
    @InjectRepository(WindowsLocalNotification)
    private repo: Repository<WindowsLocalNotification>
  ) {}

  async findByShop(shopId: string): Promise<WindowsLocalNotification[]> {
    const last5min = new Date();
    last5min.setMinutes(last5min.getMinutes() - 5);
    const windowsNotifies = await this.repo.find({
      where: {
        shop: { id: shopId },
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
    await this.repo.update(id, {
      isNotified: true,
    });
  }

  async setFailed(id: number): Promise<void> {
    this.repo.increment({ id: id }, 'failedCount', 1);
  }
}

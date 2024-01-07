import { WindowsLocalNotification } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { RedisKey, RedisService } from '../core/redis.service';

@Injectable()
export class WindowsLocalNotificationService {
  constructor(
    @InjectRepository(WindowsLocalNotification)
    private repo: Repository<WindowsLocalNotification>,
    private redis: RedisService
  ) {}

  async findByShop(shopId: string): Promise<WindowsLocalNotification[]> {
    const last5min = new Date();
    last5min.setMinutes(last5min.getMinutes() - 5);
    const redisKey = this.redis.key(RedisKey.WindowsLocalNotification, shopId);
    const data = await this.redis.client.lrange(redisKey, 0, -1);
    let windowsNotifies: WindowsLocalNotification[] = data.map((x) => JSON.parse(x));
    windowsNotifies = windowsNotifies.filter((x) => Date.now() - new Date(x.createdAt).valueOf() > 15000);
    this.redis.client.del(redisKey);
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

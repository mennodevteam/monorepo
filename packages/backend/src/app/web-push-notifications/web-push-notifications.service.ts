import { WebPushNotificationDto, WebPushSubscription } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';

@Injectable()
export class WebPushNotificationsService {
  constructor(
    @InjectRepository(WebPushSubscription)
    private repo: Repository<WebPushSubscription>
  ) {
    webpush.setVapidDetails(
      'mailto:example@yourdomain.org',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async notifToShop(shopId: string, dto: WebPushNotificationDto) {
    const subs = await this.repo.find({ where: { shop: { id: shopId } }, order: { createdAt: 'desc' } });
    for (const sub of subs) {
      this.webPushSend(sub, dto);
    }
  }

  private webPushSend(sub: WebPushSubscription, dto: WebPushNotificationDto) {
    dto.options = {
      ...dto.options,
      dir: dto.options.dir || 'rtl',
      badge: dto.options.badge || process.env.NOTIFICATION_BADGE,
      icon: dto.options.icon || process.env.NOTIFICATION_ICON,
    };
    const payload: any = {
      notification: dto.options,
    };
    payload.notification.title = dto.title;
    webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 180 }).catch((error) => {
      console.log('errrrrrrrr', error);
    });
  }
}

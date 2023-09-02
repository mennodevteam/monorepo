import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { LocalNotification, LocalNotificationsService } from './local-notifications.service';
import { Ding } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class DingService {
  constructor(private swPush: SwPush, private localNotificationsService: LocalNotificationsService) {
    this.swPush.messages.subscribe((message: any) => {
      try {
        const ding: Ding = message.notification.data.ding;
        if (ding) {
          let content = `میز ${ding.table}`;
          if (ding.description) content += `: ${ding.description}`;
          const notif = this.localNotificationsService.add({
            id: ding.id,
            createdAt: ding.createdAt,
            title: `درخواست سالن‌دار`,
            contents: [content],
            soundIndex: 1,
            lifetime: 120000,
          } as LocalNotification);
        }
      } catch (error) {}
    });
  }
}

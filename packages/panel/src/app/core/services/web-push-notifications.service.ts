import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { WebPushSubscription } from '@menno/types';
const WEB_PUSH_PUBLIC_KEY =
  'BDFTOvLq7noorcRsulFK2OcXVKCp90vyFnn1cIDv5-bVzGVapgGBWtv7uL6jbocWlrV7idapa7cw1tLz08_Smmk';

@Injectable({
  providedIn: 'root',
})
export class WebPushNotificationsService {
  isSubscribed: boolean;
  constructor(private swPush: SwPush, private http: HttpClient) {
    if (this.swPush.isEnabled) {
      this.swPush.subscription.subscribe((sub) => {
        if (!sub) {
          this.isSubscribed = false;
        } else this.isSubscribed = true;
      });
    } else {
      console.log('push notification is not supported!');
    }
  }

  get isEnabled() {
    return this.swPush.isEnabled;
  }

  async subscribe(): Promise<WebPushSubscription | undefined> {
    const sub = (
      await this.swPush.requestSubscription({
        serverPublicKey: WEB_PUSH_PUBLIC_KEY,
      })
    ).toJSON();

    if (sub.keys) {
      const wps = await this.http
        .post<WebPushSubscription>('webPushNotifications/subscribe', <WebPushSubscription>{
          endpoint: sub.endpoint,
          keys: {
            auth: sub.keys['auth'],
            p256dh: sub.keys['p256dh'],
          },
        })
        .toPromise();
      this.isSubscribed = true;
      return wps;
    }
    return;
  }
}

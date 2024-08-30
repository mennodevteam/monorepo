import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ShopService } from './shop.service';
import { Plugin, Shop } from '@menno/types';
declare var dataLayer: any[];

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  loginShopId?: string;
  constructor(private shop: ShopService) {
    if (this.shop.shop) this.init(this.shop.shop);
    else
      this.shop.shopObservable.subscribe((shop) => {
        if (shop) this.init(shop);
      });
  }

  init(shop: Shop) {
    if (shop.id !== this.loginShopId) {
      this.loginShopId = shop.id;
      const dataLayerObject: any = {
        event: 'login',
        userId: shop.id,
        userCode: shop.code,
        userTitle: shop.title,
      };

      if (shop.region) {
        dataLayerObject.userRegion = shop.region.title;
      }

      if (shop.plugins) {
        const subscriptionAllDayDiff =
          (new Date(shop.plugins.expiredAt).valueOf() - new Date(shop.plugins.renewAt).valueOf()) /
          1000 /
          3600 /
          24;
        if (subscriptionAllDayDiff < 10) dataLayerObject.userSubscriptionPlan = 'demo';
        else {
          if (shop.plugins.plugins.includes(Plugin.Club)) dataLayerObject.userSubscriptionPlan = 'club';
          else if (shop.plugins.plugins.includes(Plugin.Ordering))
            dataLayerObject.userSubscriptionPlan = 'ordering';
          else if (shop.plugins.plugins.includes(Plugin.Menu)) dataLayerObject.userSubscriptionPlan = 'menu';
          dataLayerObject.userSubscriptionPeriod = subscriptionAllDayDiff < 40 ? 'monthly' : 'yearly';
        }
        dataLayerObject.userSubscriptionRemain = Math.round(
          (new Date(shop.plugins.expiredAt).valueOf() - Date.now()) / 1000 / 3600 / 24,
        );
      }
      dataLayer.push(dataLayerObject);
    }
  }

  event(name: string, props?: { [key: string]: string | number }) {
    dataLayer.push({ event: 'customEvent', eventName: name, ...props });
  }
}

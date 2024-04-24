import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ShopService } from './shop.service';

declare let _paq: any;

@Injectable({
  providedIn: 'root',
})
export class MatomoService {
  constructor(private router: Router, private shop: ShopService) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          this.push(['trackPageView']);
        }, 500);
      }
    });

    this.shop.shopObservable.subscribe((shop) => {
      if (shop) {
        this.push(['setUserId', shop.code]);
        this.push(['setCustomDimension', 1, shop.title]);
        this.push(['setCustomDimension', 2, shop.username]);
        this.push(['setCustomDimension', 3, shop.region?.title]);

        if (shop.plugins) {
          const subDiff =
            new Date(shop.plugins.expiredAt).valueOf() - new Date(shop.plugins.renewAt).valueOf();
          const remainDiff = new Date(shop.plugins.expiredAt).valueOf() - new Date().valueOf();

          this.push(['setCustomDimension', 4, Math.floor(subDiff / 1000 / 3600 / 24)]);
          this.push(['setCustomDimension', 5, Math.floor(remainDiff / 1000 / 3600 / 24)]);
          this.push([
            'setCustomDimension',
            6,
            remainDiff < 0 ? 'expired' : Math.floor(subDiff / 1000 / 3600 / 24) < 10 ? 'demo' : 'active',
          ]);
        }
      }
    });
  }

  get push() {
    return _paq.push;
  }

  trackEvent(category: string, action: string, key?: string, value?: string | number | boolean) {
    this.push(['trackEvent', category, action, key, value]);
  }
}

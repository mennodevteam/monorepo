import { effect, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ShopService } from './shop.service';
import { ThirdPartyApp } from '@menno/types';
import clarity from '@microsoft/clarity';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private auth = inject(AuthService);
  private shopService = inject(ShopService);

  constructor() {
    if (this.clarityProjectId) {
      clarity.init(this.clarityProjectId);
    }

    effect(() => {
      const user = this.auth.user();
      if (this.clarityProjectId && user) {
        clarity.identify(user.id);
        clarity.identify(user.id, user.id, undefined, user.mobilePhone);
      }
    });
  }

  private get clarityProjectId() {
    return this.shopService.shop?.thirdParties?.find((t) => t.app === ThirdPartyApp.Clarity)?.token;
  }

  trackEvent(event: string, data?: any) {
    try {
      if (this.clarityProjectId) {
        clarity.event(event);
      }
    } catch (error) {}
  }
}

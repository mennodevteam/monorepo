import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '@menno/types';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  referrer?: string;
  campaign?: string;

  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  readonly activeCampaign = signal<Campaign | undefined>(undefined);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    let campaign = urlParams.get('campaign') || null;
    let referrer = document.referrer || null;
    if (referrer && referrer.search(window.location.origin) > -1) referrer = null;

    const storageCampaign = sessionStorage.getItem('campaign');
    if (!campaign && storageCampaign) campaign = storageCampaign;
    if (campaign) {
      sessionStorage.setItem('campaign', campaign);
      this.campaign = campaign;
    }

    const storageReferrer = sessionStorage.getItem('referrer');
    if (!referrer && storageReferrer) referrer = storageReferrer;
    if (referrer) {
      sessionStorage.setItem('referrer', referrer);
      this.referrer = referrer;
    }

    effect(() => {
      const shop = this.shopService.data();
      if (shop?.id) {
        this.http.get<Campaign>(`campaigns/active/${shop.id}`).subscribe({
          next: (campaign) => {
            this.activeCampaign.set(campaign || undefined);
          },
          error: () => {
            this.activeCampaign.set(undefined);
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  get params() {
    const params: Record<string, string> = {};
    if (this.campaign) params['campaign'] = this.campaign;
    if (this.referrer) params['referrer'] = this.referrer;
    return params;
  }
}

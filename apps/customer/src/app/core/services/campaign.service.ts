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
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  guestId?: string;

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

    // UTM parameters extraction and session persistence
    let utmSource = urlParams.get('utm_source') || null;
    const storageUtmSource = sessionStorage.getItem('utm_source');
    if (!utmSource && storageUtmSource) utmSource = storageUtmSource;
    if (utmSource) {
      sessionStorage.setItem('utm_source', utmSource);
      this.utmSource = utmSource;
    }

    let utmMedium = urlParams.get('utm_medium') || null;
    const storageUtmMedium = sessionStorage.getItem('utm_medium');
    if (!utmMedium && storageUtmMedium) utmMedium = storageUtmMedium;
    if (utmMedium) {
      sessionStorage.setItem('utm_medium', utmMedium);
      this.utmMedium = utmMedium;
    }

    let utmCampaign = urlParams.get('utm_campaign') || null;
    const storageUtmCampaign = sessionStorage.getItem('utm_campaign');
    if (!utmCampaign && storageUtmCampaign) utmCampaign = storageUtmCampaign;
    if (utmCampaign) {
      sessionStorage.setItem('utm_campaign', utmCampaign);
      this.utmCampaign = utmCampaign;
    }

    let utmTerm = urlParams.get('utm_term') || null;
    const storageUtmTerm = sessionStorage.getItem('utm_term');
    if (!utmTerm && storageUtmTerm) utmTerm = storageUtmTerm;
    if (utmTerm) {
      sessionStorage.setItem('utm_term', utmTerm);
      this.utmTerm = utmTerm;
    }

    let utmContent = urlParams.get('utm_content') || null;
    const storageUtmContent = sessionStorage.getItem('utm_content');
    if (!utmContent && storageUtmContent) utmContent = storageUtmContent;
    if (utmContent) {
      sessionStorage.setItem('utm_content', utmContent);
      this.utmContent = utmContent;
    }

    // Persistent visitor/guest ID
    let guestId = localStorage.getItem('menno_guest_id') || sessionStorage.getItem('menno_guest_id');
    if (!guestId) {
      guestId = 'g_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      try {
        localStorage.setItem('menno_guest_id', guestId);
        sessionStorage.setItem('menno_guest_id', guestId);
      } catch {
        // Ignore storage quotas or restrictions
      }
    }
    this.guestId = guestId;

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
    if (this.utmSource) params['utmSource'] = this.utmSource;
    if (this.utmMedium) params['utmMedium'] = this.utmMedium;
    if (this.utmCampaign) params['utmCampaign'] = this.utmCampaign;
    if (this.utmTerm) params['utmTerm'] = this.utmTerm;
    if (this.utmContent) params['utmContent'] = this.utmContent;
    if (this.guestId) params['guestId'] = this.guestId;
    return params;
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  referrer?: string;
  campaign?: string;
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    let campaign = urlParams.get('campaign') || null;
    let referrer = document.referrer || null;
    if (referrer && referrer.search(location.origin) > -1) referrer = null;

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
  }

  get params() {
    const params: any = {};
    if (this.campaign) params.campaign = this.campaign;
    if (this.referrer) params.referrer = this.referrer;
    return params;
  }
}

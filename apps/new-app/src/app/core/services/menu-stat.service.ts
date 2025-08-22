import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CampaignService } from './campaign.service';
import { MenuService } from './menu.service';
import { AuthService } from './auth.service';
import { MenuStatDto, StatAction } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MenuStatService {
  private http = inject(HttpClient);
  private menu = inject(MenuService);
  private campaign = inject(CampaignService);
  private auth = inject(AuthService);

  async send(action: StatAction, params?: Pick<MenuStatDto, 'productId' | 'value'>) {
    try {
      let queryParams: HttpParams = new HttpParams();
      const referrer = this.campaign.referrer;
      const campaign = this.campaign.campaign;
      if (referrer) {
        queryParams = queryParams.set('referrer', referrer);
      }
      if (campaign) {
        queryParams = queryParams.set('campaign', campaign);
      }

      await this.http
        .post('menuStats', { action, menuId: this.menu.menu().id, ...params } as MenuStatDto, {
          params: queryParams,
        })
        .toPromise();
    } catch (error) {
      console.error(error);
    }
  }
}

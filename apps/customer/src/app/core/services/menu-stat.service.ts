import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CampaignService } from './campaign.service';
import { MenuService } from './menu.service';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { MenuStatDto, StatAction } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MenuStatService {
  private http = inject(HttpClient);
  private menu = inject(MenuService);
  private campaign = inject(CampaignService);
  private auth = inject(AuthService);
  private logger = inject(LoggerService);

  async send(action: StatAction, params?: Pick<MenuStatDto, 'productId' | 'value'>) {
    try {
      let queryParams: HttpParams = new HttpParams();
      const campaignParams = this.campaign.params;
      for (const [key, value] of Object.entries(campaignParams)) {
        if (value) {
          queryParams = queryParams.set(key, value);
        }
      }

      await this.http
        .post(
          'menuStats',
          {
            action,
            menuId: this.menu.data()?.id,
            ...params,
            ...campaignParams,
          } as MenuStatDto,
          {
            params: queryParams,
          },
        )
        .toPromise();
    } catch (error) {
      this.logger.error('Failed to send menuStat', error);
    }
  }
}

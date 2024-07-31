import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BusinessCategory, OrderType, Plugin, Shop } from '@menno/types';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ThemeService } from './theme.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _loading = new BehaviorSubject<void>(undefined);
  shop: Shop;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private themeService: ThemeService,
    private translate: TranslateService,
  ) {
    this.load();
  }

  private async load() {
    const query = this.getShopUsernameFromQuery();
    const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
    // if (Date.now() - new Date(shop?.plugins?.expiredAt || 0).valueOf() > 2 * 24 * 3600 * 1000) {
    //   this.dialog.open(AlertDialogComponent, {
    //     data: {
    //       title: this.translate.instant('expiredDialog.title'),
    //       description: this.translate.instant('expiredDialog.description'),
    //       hideCancel: true,
    //       hideOk: true,
    //       status: 'warning',
    //     },
    //     disableClose: true,
    //   });
    // }

    if (shop) {
      if (shop.appConfig?.theme) {
        this.themeService.setThemeFromColor(shop.appConfig.themeHex || shop.appConfig.theme.primaryColor, shop.appConfig.themeMode);
      }

      try {
        (window as any).clarity('identify', shop.username, this.auth.user()?.username, undefined, shop.title);
      } catch (error) {
        // unhandled
      }
      this.shop = shop;
      this._loading.complete();
    }
  }

  getShopUsernameFromQuery() {
    const hostname = location.hostname;
    if (hostname.search('menno') > -1 || !environment.production) {
      const query = hostname.split('.')[0];
      if (query === '192') return 'lime-golestan';
      return query;
    }
    return hostname;
  }

  hasOrderingPlugin() {
    return this.shop?.plugins?.plugins ? this.shop?.plugins?.plugins.indexOf(Plugin.Ordering) > -1 : false;
  }

  get selectableOrderTypes() {
    return this.shop?.appConfig?.selectableOrderTypes || [];
  }

  get defaultOrderType() {
    return this.shop?.appConfig?.selectableOrderTypes[0];
  }

  get hasMultipleOrderType() {
    return (
      this.shop?.appConfig?.selectableOrderTypes?.length &&
      this.shop.appConfig.selectableOrderTypes.length > 1
    );
  }

  get isCloseTime() {
    if (!this.shop?.details.openingHours?.length) return false;
    return this.shop.appConfig?.disableOrderingOnClose && !Shop.isOpen(this.shop.details.openingHours);
  }

  get isOrderingTemporaryDisabled() {
    return this.hasOrderingPlugin() && this.shop.appConfig?.disableOrdering;
  }

  isOrderingDisabledOnType(type?: OrderType) {
    if (type == undefined) return false;
    return this.hasOrderingPlugin() && this.shop.appConfig?.orderingTypes.findIndex((x) => x === type) === -1;
  }

  get url() {
    return this.shop?.domain
      ? `https://${this.shop?.domain}`
      : `https://${this.shop?.username}.${environment.appDomain}`;
  }

  get businessCategoryTitle() {
    return this.translate.instant(`shop.category.${this.shop.businessCategory || BusinessCategory.Other}`);
  }

  async getResolver() {
    if (this.shop) return this.shop;
    return this._loading.asObservable().toPromise();
  }
}

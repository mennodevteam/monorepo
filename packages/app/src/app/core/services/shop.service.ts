import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ding, Plugin, Shop, ThemeMode } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ThemeService } from './theme.service';
import { PwaService } from './pwa.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _shop: BehaviorSubject<Shop | null> = new BehaviorSubject<Shop | null>(null);
  dingInterval: any;
  dingTimer = 0;

  constructor(private http: HttpClient, private themeService: ThemeService, private pwa: PwaService) {
    this.load();
  }

  async load() {
    const query = this.getShopUsernameFromQuery();
    if (
      !this._shop.value ||
      (this._shop.value.username !== query &&
        this._shop.value.code !== query &&
        this._shop.value.domain !== query)
    ) {
      this._shop.next(null);

      const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
      this._shop.next(shop || null);

      // set theme
      if (shop?.appConfig?.theme) {
        const theme = shop?.appConfig?.theme;
        this.themeService.color = theme.key;
        switch (shop?.appConfig.themeMode) {
          case ThemeMode.Dark:
            this.themeService.mode = 'dark';
            break;
          case ThemeMode.Light:
            this.themeService.mode = 'light';
            break;
        }
      }

      if (shop) {
        if (shop.appConfig?.theme) {
          this.pwa.setManifest(
            shop,
            this.url,
            shop.appConfig.theme.primaryColor,
            shop.appConfig.themeMode === ThemeMode.Dark ? '#333333' : '#ffffff'
          );
        } else {
          this.pwa.setManifest(shop, this.url);
        }
      }
    }
  }

  getShopUsernameFromQuery() {
    const hostname = location.hostname;
    const query = hostname.split('.')[0];
    return query;
  }

  get shopObservable() {
    return this._shop.asObservable();
  }

  hasOrderingPlugin() {
    return this.shop?.plugins?.plugins ? this.shop?.plugins?.plugins.indexOf(Plugin.Ordering) > -1 : false;
  }

  get isOpen() {
    if (!this.shop?.details.openingHours?.length) return true;
    return !this.shop.appConfig?.disableOrderingOnClose || Shop.isOpen(this.shop.details.openingHours);
  }

  get shop() {
    return this._shop.value;
  }

  get url() {
    return this.shop?.domain || `https://${this.shop?.username}.${environment.appDomain}`;
  }

  ding(table: string, description?: string) {
    const params: { [param: string]: string } = {};
    if (this.shop && this.dingTimer <= 0) {
      if (description) params['description'] = description;
      if (this.dingInterval) clearInterval(this.dingInterval);
      this.dingTimer = 60;
      this.dingInterval = setInterval(() => {
        if (this.dingTimer > 0) this.dingTimer--;
      }, 1000);
      return this.http
        .get<Ding>(`ding/${this.shop.id}/${table}`, {
          params,
        })
        .toPromise();
    }
    return;
  }
}

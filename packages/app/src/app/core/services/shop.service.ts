import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Shop, ThemeMode } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _shop: BehaviorSubject<Shop | null> = new BehaviorSubject<Shop | null>(null);

  constructor(private http: HttpClient, private themeService: ThemeService) {
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

  get shop() {
    return this._shop.value;
  }
}

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
    const query = location.hostname;
    if (
      !this._shop.value ||
      (this._shop.value.code !== query && this._shop.value.domain !== query)
    ) {
      this._shop.next(null);

      const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
      this._shop.next(shop || null);

      // set theme
      if (shop?.appConfig?.theme) {
        const theme = shop?.appConfig?.theme;
        this.themeService.color = theme.key;
        if (shop?.appConfig.themeMode)
          this.themeService.mode = shop?.appConfig.themeMode === ThemeMode.dark ? 'dark' : 'light';
      }
    }
  }

  get shopObservable() {
    return this._shop.asObservable();
  }

  get shop() {
    return this._shop.value;
  }
}

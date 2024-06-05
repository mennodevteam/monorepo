import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ding, Plugin, Shop, ThemeMode } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { PwaService } from './pwa.service';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _shop: BehaviorSubject<Shop | null> = new BehaviorSubject<Shop | null>(null);
  dingInterval: any;
  dingTimer = 0;

  constructor(
    private http: HttpClient,
    private pwa: PwaService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private auth: AuthService
  ) {
    this.load();
  }

  async load(skipNull = false) {
    const query = this.getShopUsernameFromQuery();
    if (!skipNull) this._shop.next(null);

    const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
    this._shop.next(shop || null);

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
        this.pwa.setManifest(
          shop,
          this.url,
          shop.appConfig.theme.primaryColor,
          shop.appConfig.themeMode === ThemeMode.Dark ? '#333333' : '#ffffff'
        );
      } else {
        this.pwa.setManifest(shop, this.url);
      }

      try {
        (window as any).clarity('identify', shop.username, this.auth.user?.username, undefined, shop.title);
      } catch (error) {
        // unhandled
      }
    }
  }

  getShopUsernameFromQuery() {
    const hostname = location.hostname;
    if (hostname.search(environment.appDomain) > -1 || !environment.production) {
      const query = hostname.split('.')[0];
      return query;
    }
    return hostname;
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

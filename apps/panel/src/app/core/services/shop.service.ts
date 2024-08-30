import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BusinessCategory, Plugin, Shop, ShopUser, ThirdParty } from '@menno/types';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
declare var dataLayer: any[];

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private shop$: BehaviorSubject<Shop | null>;
  private _loading = true;
  constructor(
    private http: HttpClient,
    private translate: TranslateService,
  ) {
    this.shop$ = new BehaviorSubject<Shop | null>(null);
    this.loadShop().then((shop) => {
      if (shop) {
        const dataLayerObject: any = {
          event: 'login',
          userId: shop.id,
          userCode: shop.code,
          userTitle: shop.title,
        };

        if (shop.plugins) {
          const subscriptionAllDayDiff =
            (new Date(shop.plugins.expiredAt).valueOf() - new Date(shop.plugins.renewAt).valueOf()) /
            1000 /
            3600 /
            24;
          if (subscriptionAllDayDiff < 10) dataLayerObject.userSubscriptionPlan = 'demo';
          else {
            if (shop.plugins.plugins.includes(Plugin.Club)) dataLayerObject.userSubscriptionPlan = 'club';
            else if (shop.plugins.plugins.includes(Plugin.Ordering))
              dataLayerObject.userSubscriptionPlan = 'ordering';
            else if (shop.plugins.plugins.includes(Plugin.Menu))
              dataLayerObject.userSubscriptionPlan = 'menu';
            dataLayerObject.userSubscriptionPeriod = subscriptionAllDayDiff < 40 ? 'monthly' : 'yearly';
          }
          dataLayerObject.userSubscriptionRemain = Math.round(
            (new Date(shop.plugins.expiredAt).valueOf() - Date.now()) / 1000 / 3600 / 24,
          );
        }
        dataLayer.push(dataLayerObject);
      }
    });
    setInterval(() => {
      this.loadShop();
    }, 60000);
  }

  get shopObservable() {
    if (!this.shop && !this._loading) this.loadShop();
    return this.shop$.asObservable();
  }

  get shop() {
    return this.shop$.value;
  }

  async loadShop() {
    this._loading = true;
    try {
      const shop = await this.http.get<Shop>('shops').toPromise();
      if (shop) {
        this.shop$.next(shop);
        return shop;
      }
    } finally {
      this._loading = false;
    }
    return;
  }

  async saveShop(dto: Shop) {
    dto.id = this.shop!.id;
    await this.http.put(`shops`, dto).toPromise();
    await this.loadShop();
  }

  smsLink(phone: string): Promise<void> {
    return this.http.get<void>('shops/sendLink/' + phone).toPromise();
  }

  get appLink() {
    return this.shop ? Shop.appLink(this.shop, environment.appDomain) : '';
  }

  getShopUsers(): Promise<ShopUser[] | undefined> {
    return this.http.get<ShopUser[]>('shopUsers').toPromise();
  }

  saveShopUser(shopUser: ShopUser): Promise<ShopUser | undefined> {
    return this.http.post<ShopUser>(`shopUsers`, shopUser).toPromise();
  }

  async saveThirdParty(dto: ThirdParty) {
    await this.http.post(`thirdParties`, dto).toPromise();
    await this.loadShop();
  }

  async removeShopUser(shopUserId: string): Promise<void> {
    await this.http.delete(`shopUsers/${shopUserId}`).toPromise();
  }

  get businessCategoryTitle() {
    return this.translate.instant(
      `shopPage.category.${this.shop?.businessCategory || BusinessCategory.Other}`,
    );
  }

  get isRestaurantOrCoffeeShop() {
    return (
      !this.shop?.businessCategory ||
      [BusinessCategory.Cafe, BusinessCategory.Restaurant, BusinessCategory.CafeRestaurant].indexOf(
        this.shop.businessCategory,
      ) > -1
    );
  }

  get orderIcon() {
    return this.isRestaurantOrCoffeeShop ? 'utensils' : 'receipt';
  }
}

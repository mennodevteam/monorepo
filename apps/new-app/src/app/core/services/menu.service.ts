import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, computed, effect, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BusinessCategory, Menu, OrderType, Product } from '@menno/types';
import { ShopService } from './shop.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CampaignService } from './campaign.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _loading = new BehaviorSubject<void>(undefined);
  private baseMenu = signal<Menu | undefined>(undefined);
  type = signal<OrderType | undefined>(undefined);
  star = signal<number | undefined>(undefined);
  searchText = signal('');
  menu = computed(() => {
    const menu: Menu = JSON.parse(JSON.stringify(this.baseMenu() || {}));
    if (this.searchText()) {
      menu.categories = Menu.search(menu, this.searchText());
    }
    Menu.setRefsAndSort(
      menu,
      this.type() == null ? undefined : this.type(),
      undefined,
      undefined,
      this.star(),
      false,
    );
    return menu;
  });

  categories = computed(() => {
    return this.menu().categories || [];
  });

  menuCosts = computed(() => {
    return this.menu().costs || [];
  });

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private translate: TranslateService,
    private campaign: CampaignService,
  ) {
    effect(() => {
      const menu = this.menu();
      if (menu.id) this._loading.complete();
    });
    this.load(true);
  }

  async load(sendStat?: boolean) {
    const query = this.shopService.getShopUsernameFromQuery();
    const baseMenu = await this.http.get<Menu>(`menus/${query}`).toPromise();
    await this.shopService.getResolver();
    if (baseMenu) {
      if (this.shopService.selectableOrderTypes.length > 0) this.type.set(this.shopService.defaultOrderType);

      this.baseMenu.set({ ...baseMenu });

      if (sendStat) {
        console.log(this.campaign.params)
        this.http.get(`menuStats/loadMenu/${baseMenu.id}`, { params: this.campaign.params }).toPromise();
      }
    }
  }

  sendProductStat(productId: string) {
    if (this.menu) this.http.get(`menuStats/clickProduct/${this.menu().id}/${productId}`).toPromise();
  }

  getProductById(id: string): Product | null {
    if (this.menu) return Menu.getProductById(this.menu(), id);
    return null;
  }

  async getResolver() {
    if (this.menu()?.id) return this.baseMenu();
    return this._loading.asObservable().toPromise();
  }

  get businessCategoryTitle() {
    return this.translate.instant(
      `menu.category.${this.shopService.shop.businessCategory || BusinessCategory.Cafe}`,
    );
  }

  share() {
    const shop = this.shopService.shop;
    const text = this.translate.instant('seo.description', {
      title: shop.title,
      address: shop.address || '',
      phone: shop.phones.join(', '),
      menuTitle: this.businessCategoryTitle,
      shopTitle: this.shopService.businessCategoryTitle,
    });
    try {
      const shareData = {
        title: shop.title,
        text,
        url: location.origin,
      };
      navigator.share(shareData);
    } catch (error) {}
  }
}

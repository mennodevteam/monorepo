import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, computed, effect, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BusinessCategory, Menu, OrderType, Product, ProductCategory } from '@menno/types';
import { ShopService } from './shop.service';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { CampaignService } from './campaign.service';
import Fuse from 'fuse.js';

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

  searchCategories = computed(() => {
    if (this.searchText()) {
      const products = Menu.getProductList(this.menu());
      const fuse = new Fuse(products, {
        keys: [
          {
            name: 'title',
            weight: 1,
          },
          {
            name: 'description',
            weight: 0.5,
          },
          {
            name: 'variants.title',
            weight: 0.5,
          },
        ],
        threshold: 0.2,
      });
      const result = fuse.search(this.searchText());
      return [
        {
          title: this.translate.instant('menu.searchResults'),
          products: result.map((x) => x.item),
        } as ProductCategory,
      ];
    }
    return [];
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
    const baseMenu = await this.http
      .get<Menu>(`menus/${query}`, {
        headers: {
          skipJwt: 'true',
        },
      })
      .toPromise();
    await this.shopService.getResolver();
    if (baseMenu) {
      if (this.shopService.selectableOrderTypes.length > 0) this.type.set(this.shopService.defaultOrderType);

      this.baseMenu.set({ ...baseMenu });

      if (sendStat) {
        this.http.get(`menuStats/loadMenu/${baseMenu.id}`, { params: this.campaign.params }).toPromise();
      }
    }
  }

  sendProductStat(productId: string) {
    if (this.menu)
      this.http
        .get(`menuStats/clickProduct/${this.menu().id}/${productId}`, { params: this.campaign.params })
        .toPromise();
  }

  sendAddToCardStat(productId: string) {
    if (this.menu)
      this.http
        .get(`menuStats/addToCart/${this.menu().id}/${productId}`, { params: this.campaign.params })
        .toPromise();
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

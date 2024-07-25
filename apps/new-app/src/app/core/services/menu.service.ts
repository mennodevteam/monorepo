import { HttpClient } from '@angular/common/http';
import { Injectable, WritableSignal, computed, effect, signal } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Menu, OrderType, Product } from '@menno/types';
import { ShopService } from './shop.service';
import { BehaviorSubject } from 'rxjs';

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
    private bottomSheet: MatBottomSheet,
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
        this.http.get(`menuStats/loadMenu/${baseMenu.id}`).toPromise();
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

  // checkSelectedOrderType() {
  //   if (this.type == undefined) {
  //     this.selectableOrderTypes = this.shopService.shop?.appConfig?.selectableOrderTypes || [];
  //     if (!this.selectableOrderTypes || this.selectableOrderTypes.length === 0)
  //       this.selectableOrderTypes = [OrderType.DineIn];

  //     if (
  //       this.shopService.shop?.appConfig?.disableOrdering &&
  //       !this.menu()?.costs.find((x) => x.orderTypes.length < 3)
  //     )
  //       this.selectableOrderTypes = [OrderType.DineIn];

  //     if (this.selectableOrderTypes.length === 1) this.type = this.selectableOrderTypes[0];
  //     else this.openSelectOrderType();
  //   }
  // }

  openSelectOrderType() {
    // this.bottomSheet
    //   .open(SelectOrderTypeModalComponent, {
    //     closeOnNavigation: true,
    //     disableClose: this.type == undefined,
    //   })
    //   .afterDismissed()
    //   .subscribe((type) => {
    //     if (type != undefined) this.type = type;
    //   });
  }

  async getResolver() {
    if (this.menu()?.id) return this.baseMenu();
    return this._loading.asObservable().toPromise();
  }
}

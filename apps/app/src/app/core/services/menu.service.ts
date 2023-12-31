import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Menu, MenuViewType, OrderType, Product, ProductCategory } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { SelectOrderTypeModalComponent } from '../../pages/ordering/select-order-type-modal/select-order-type-modal.component';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _menu = new BehaviorSubject<Menu | null>(null);
  private _type = new BehaviorSubject<OrderType | null>(null);
  private _star?: number;
  private _baseMenu: Menu | undefined;
  selectableOrderTypes: OrderType[];

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private bottomSheet: MatBottomSheet
  ) {
    this.load();
  }

  async load() {
    const query = this.shopService.getShopUsernameFromQuery();
    this._baseMenu = await this.http.get<Menu>(`menus/${query}`).toPromise();

    if (this.shopService.shop?.appConfig?.selectableOrderTypes[0] != undefined)
      this.type = this.shopService.shop?.appConfig?.selectableOrderTypes[0];

    if (this._baseMenu) {
      const menu = this.baseMenu;
      Menu.setRefsAndSort(menu, undefined, undefined, undefined, this._star);
      this._menu.next(menu);
    } else {
      this._menu.next(null);
    }
  }

  get menu() {
    return this._menu.value;
  }

  get menuObservable() {
    return this._menu.asObservable();
  }

  private get baseMenu() {
    return JSON.parse(JSON.stringify(this._baseMenu));
  }

  set type(val: OrderType | null) {
    this._type.next(val);
    if (this.menu) {
      const menu = this.baseMenu;
      Menu.setRefsAndSort(menu, val == null ? undefined : val, undefined, undefined, this._star);
      this._menu.next(menu);
    }
  }

  get type() {
    return this._type.value;
  }

  set star(value: number | undefined) {
    this._star = value;
    if (this.menu) {
      const menu = this.baseMenu;
      Menu.setRefsAndSort(menu, this.type == null ? undefined : this.type, undefined, undefined, this._star);
      this._menu.next(menu);
    }
  }

  get typeObservable() {
    return this._type.asObservable();
  }

  getProductById(id: string): Product | null {
    if (this.menu) return Menu.getProductById(this.menu, id);
    return null;
  }

  checkSelectedOrderType() {
    if (this.type == undefined) {
      this.selectableOrderTypes = this.shopService.shop?.appConfig?.selectableOrderTypes || [];
      if (!this.selectableOrderTypes || this.selectableOrderTypes.length === 0)
        this.selectableOrderTypes = [OrderType.DineIn];

      if (
        this.shopService.shop?.appConfig?.disableOrdering &&
        !this.menu?.costs.find((x) => x.orderTypes.length < 3)
      )
        this.selectableOrderTypes = [OrderType.DineIn];

      if (this.selectableOrderTypes.length === 1) this.type = this.selectableOrderTypes[0];
      else this.openSelectOrderType();
    }
  }

  openSelectOrderType() {
    this.bottomSheet
      .open(SelectOrderTypeModalComponent, {
        closeOnNavigation: true,
        disableClose: this.type == undefined,
      })
      .afterDismissed()
      .subscribe((type) => {
        if (type != undefined) this.type = type;
      });
  }
}

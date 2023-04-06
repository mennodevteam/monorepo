import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Menu, OrderType, Product, ProductCategory } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { SelectOrderTypeModalComponent } from '../../pages/ordering/select-order-type-modal/select-order-type-modal.component';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _menu = new BehaviorSubject<Menu | null>(null);
  private _type = new BehaviorSubject<OrderType | null>(null);
  private _baseMenu: Menu | undefined;

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

    if (this._baseMenu) {
      const menu = this.baseMenu;
      Menu.setRefsAndSort(menu);
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
      Menu.setRefsAndSort(menu, val == null ? undefined : val);
      this._menu.next(menu);
    }
  }

  get type() {
    return this._type.value;
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
      let selectableOrderTypes = this.shopService.shop?.appConfig?.selectableOrderTypes;
      if (!selectableOrderTypes || selectableOrderTypes.length === 0)
        selectableOrderTypes = [OrderType.DineIn];
      if (selectableOrderTypes.length === 1) this._type.next(selectableOrderTypes[0]);
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

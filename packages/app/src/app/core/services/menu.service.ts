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

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private bottomSheet: MatBottomSheet
  ) {
    this.load();
  }

  async load() {
    const query = this.shopService.getShopUsernameFromQuery();
    const menu = await this.http.get<Menu>(`menus/${query}`).toPromise();

    if (menu) {
      Menu.setRefsAndSort(menu);
    }
    this._menu.next(menu || null);
  }

  get menu() {
    return this._menu.value;
  }

  get menuObservable() {
    return this._menu.asObservable();
  }

  set type(val: OrderType | null) {
    this._type.next(val);
    if (this.menu) {
      Menu.setRefsAndSort(this.menu, val || undefined);
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
      else this.selectOrderType();
    }
  }

  selectOrderType() {
    this.bottomSheet
      .open(SelectOrderTypeModalComponent, {
        closeOnNavigation: true,
        disableClose: true,
      })
      .afterDismissed()
      .subscribe((type) => {
        if (type != undefined) this.type = type;
      });
  }
}

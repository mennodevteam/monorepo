import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, OrderType, Product, ProductCategory } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _menu = new BehaviorSubject<Menu | null>(null);
  private _type = new BehaviorSubject<OrderType | null>(null);

  constructor(private http: HttpClient, private shopService: ShopService) {
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
}

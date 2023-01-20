import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, Product, ProductCategory } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _menu: BehaviorSubject<Menu | null> = new BehaviorSubject<Menu | null>(null);

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

  getProductById(id: string): Product | null {
    if (this.menu) return Menu.getProductById(this.menu, id);
    return null;
  }
}

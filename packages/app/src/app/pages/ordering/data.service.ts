import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, Product, ProductCategory, Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private _shop: BehaviorSubject<Shop | null> =
    new BehaviorSubject<Shop | null>(null);
  private _menu: BehaviorSubject<Menu | null> =
    new BehaviorSubject<Menu | null>(null);

  constructor(private http: HttpClient) {}

  async load(query: string) {
    if (
      !this._shop.value ||
      (this._shop.value.code !== query && this._shop.value.domain !== query)
    ) {
      this._shop.next(null);
      this._menu.next(null);

      const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
      this._shop.next(shop || null);
      const menu = await this.http.get<Menu>(`menus/${query}`).toPromise();
      this._menu.next(menu || null);
    }
  }

  get shop() {
    return this._shop.value;
  }

  get menu() {
    return this._menu.value;
  }

  getProductById(id: string): Product | null {
    try {
      const menu = this.menu;
      if (menu && menu.categories) {
        for (const cat of menu.categories) {
          if (cat.products) {
            for (const prod of cat.products) {
              if (prod.id === id) return prod;
            }
          }
        }
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}

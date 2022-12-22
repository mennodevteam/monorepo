import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, ProductCategory, Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private shop$: BehaviorSubject<Shop | null>;
  constructor(private http: HttpClient) {
    this.shop$ = new BehaviorSubject<Shop | null>(null);
    this.loadShop();
  }

  get shopValue(): Shop | null {
    return this.shop$.getValue();
  }

  get shop() {
    return this.shop$.asObservable();
  }

  updateShop(data: Shop) {
    const state = { ...this.shop, ...data };
    if (data.menu?.categories && state.menu?.categories) {
      Menu.sortCategories(state.menu.categories);

      for (const cat of state.menu?.categories) {
        const dataCatIndex = data.menu.categories.indexOf(cat);
        if (dataCatIndex > -1 && data.menu.categories[dataCatIndex].products && cat.products)
          ProductCategory.sortProducts(cat.products);
      }
    }
    this.shop$.next(state);
  }

  updateMenu(data: Menu) {
    this.updateShop(<Shop>{
      menu: {
        ...this.shopValue?.menu,
        ...data,
      },
    });
  }

  async loadShop() {
    const shop = await this.http.get<Shop>('shops').toPromise();
    if (shop) {
      if (shop.menu?.categories) {
        for (const cat of shop.menu.categories) {
          if (cat.products) {
            for (const p of cat.products) {
              p.category = cat;
            }
          }
        }
      }
      this.updateShop(shop);
    }
  }
}

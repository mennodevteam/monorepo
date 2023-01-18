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
    const query = location.hostname;
    const menu = await this.http.get<Menu>(`menus/${query}`).toPromise();
    if (menu?.categories) {
      menu.categories = menu.categories.filter((x) => x.products?.length);
      ProductCategory.sort(menu.categories);
      for (const cat of menu.categories) {
        cat.costs = menu.costs?.filter(
          (x) =>
            (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
            x.includeProductCategory.find((y) => y.id === cat.id)
        );
        if (cat.products) {
          Product.sort(cat.products);
          for (const p of cat.products) {
            p.costs = menu.costs?.filter(
              (x) =>
                !cat.costs?.find((y) => y.id === x.id) &&
                ((!x.includeProduct?.length && !x.includeProductCategory?.length) ||
                  x.includeProduct.find((y) => y.id === p.id))
            );
          }
        }
      }
    }
    console.log(menu);
    this._menu.next(menu || null);
  }

  get menu() {
    return this._menu.value;
  }

  get menuObservable() {
    return this._menu.asObservable();
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

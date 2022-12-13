import { waitForAsync } from '@angular/core/testing';
import { MenuCost } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Menu } from '@menno/types';
import { Product } from '@menno/types';
import { ProductCategory } from '@menno/types';
import { ShopService } from './shop.service';
import { QuantityLogDto } from '@menno/types';
import { StockItem } from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _menu: BehaviorSubject<Menu> = new BehaviorSubject(undefined);
  private _menuCosts: BehaviorSubject<MenuCost[]> = new BehaviorSubject(undefined);

  constructor(private shopService: ShopService, private http: HttpClient, private auth: AuthService) {
    this.load();
    setInterval(() => {
      this.loadStockItems();
    }, 30000);
  }

  async load() {
    const menu = await this.http.get<Menu>(`menus`).toPromise();
    try {
      try {
        menu.categories.sort(
          (a, b) => {
            if (a.position && b.position) return a.position - b.position;
            if (a.position && !b.position) return 1;
            if (!a.position && b.position) return -1;
            return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
          }
        );
      } catch (error) { }
      for (const cat of menu.categories) {
        try {
          cat.products.sort(
            (a, b) => {
              if (a.position && b.position) return a.position - b.position;
              if (a.position && !b.position) return 1;
              if (!a.position && b.position) return -1;
              return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
            }
          );
        } catch (error) { }
        cat.menu = menu;
        for (const p of cat.products) {
          p.category = cat;
        }
      }
      this._menu.next(menu);

      this.loadStockItems();
      this.loadMenuCost();
    } catch (error) { }
  }

  loadStockItems() {
    return new Promise<void>((resolve) => {
      this.http.get('stockItems').subscribe((items: StockItem[]) => {
        for (const cat of this._menu.value.categories) {
          for (const p of cat.products) {
            p.stockItem = items.find(x => x.id === p.id);
          }
        }
        resolve();
      });
    })
  }

  loadMenuCost() {
    this.http.get<MenuCost[]>('menuCosts').subscribe((costs) => {
      this._menuCosts.next(costs);
      for (const cat of this._menu.value.categories) {
        for (const p of cat.products) {
          p.costs = costs.filter(x => {
            if ((!x.includeProductCategoryIds || !x.includeProductCategoryIds.length) && (!x.includeProductIds || !x.includeProductIds.length)) return true;
            if (x.includeProductCategoryIds && x.includeProductCategoryIds.indexOf(p.category.id) > -1) return true;
            if (x.includeProductIds && x.includeProductIds.indexOf(p.id) > -1) return true;
            return false;
          });
        }
      }
    });
  }

  get menu(): Observable<Menu> {
    return new Observable((fn) => this._menu.subscribe(fn));
  }

  get menuCosts(): Observable<MenuCost[]> {
    return new Observable((fn) => this._menuCosts.subscribe(fn));
  }

  get categories(): Observable<ProductCategory[]> {
    return new Observable((fn) =>
      this._menu.pipe(map((x) => (x ? x.categories : []))).subscribe(fn)
    );
  }

  get costs(): Observable<MenuCost[]> {
    return new Observable((fn) =>
      this._menu.pipe(map((x) => (x ? x.costs : []))).subscribe(fn)
    );
  }

  async saveCategories(
    categories: ProductCategory[],
    skipLoad?: boolean,
  ): Promise<ProductCategory[]> {
    const savedCats = await this.http
      .post<ProductCategory[]>('productCategories', categories)
      .toPromise();
    if (!skipLoad) await this.load();
    return savedCats;
  }

  async saveProduct(product: Product, skipLoad?: boolean): Promise<Product> {
    const savedProd = await this.http.post<Product>('products', product).toPromise();
    if (!skipLoad) this.load();
    return savedProd;
  }

  async removeCategory(categoryId: number): Promise<void> {
    await this.http.delete(`productCategories/${categoryId}`).toPromise();
    this.load();
  }

  async removeProduct(productId: string): Promise<void> {
    await this.http.delete(`products/${productId}`).toPromise();
    this.load();
  }

  async sortCategories(sortedIds: number[]): Promise<void> {
    await this.http.post(`productCategories/sort`, sortedIds).toPromise();
    this.load();
  }

  async sortProducts(sortedIds: string[]): Promise<void> {
    await this.http.post(`products/sort`, sortedIds).toPromise();
    this.load();
  }

  getProductById(id: string): Product {
    for (const cat of this.instant.categories) {
      const p = cat.products.find((x) => x.id === id);
      if (p) return p;
    }
  }

  get instant(): Menu {
    return this._menu.value;
  }

  async removeMenuCost(menuCostId: number): Promise<void> {
    await this.http.delete(`menuCosts/${menuCostId}`).toPromise();
    this.loadMenuCost();
  }

  async saveMenuCost(menuCost: MenuCost): Promise<void> {
    await this.http.post<MenuCost>('menuCosts', menuCost).toPromise();
    this.loadMenuCost();
  }

  async setStockItemQuantity(product: Product, quantity: number) {
    const currentQuantity = product.stockItem ? product.stockItem.quantity : 0;
    const change = quantity - currentQuantity;
    await this.http.post('stockItems/changes', <QuantityLogDto>{
      businessId: this.shopService.instant.id,
      itemId: product.id,
      description: 'manual update',
      userId: this.auth.instantUser.id,
      change,
    }).toPromise();
    this.loadStockItems();
  }
}

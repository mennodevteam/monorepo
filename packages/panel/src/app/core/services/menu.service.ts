import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, MenuCost, Product, ProductCategory, Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menu$: BehaviorSubject<Menu | null>;
  private _baseMenu: Menu | undefined;
  private _loading = true;
  constructor(private http: HttpClient) {
    this.menu$ = new BehaviorSubject<Menu | null>(null);
    this.loadMenu();
  }

  async loadMenu() {
    this._loading = true;
    try {
      this._baseMenu = await this.http.get<Menu>(`menus`).toPromise();
      if (this._baseMenu) {
        const m = this.baseMenu;
        Menu.setRefsAndSort(m, undefined, true, true);
        this.menu$.next(m);
      }
    } finally {
      this._loading = false;
    }
  }

  get baseMenu() {
    return JSON.parse(JSON.stringify(this._baseMenu));
  }

  get menuObservable() {
    if (!this.menu && !this._loading) this.loadMenu();
    return this.menu$.asObservable();
  }

  get menu() {
    return this.menu$.value;
  }

  async saveCategory(dto: ProductCategory) {
    dto.menu = <Menu>{ id: this.menu?.id };
    const newCat = await this.http.post<ProductCategory>(`productCategories`, dto).toPromise();
    await this.loadMenu();
    return newCat;
  }

  async deleteCategory(categoryId: number) {
    const category = this.menu?.categories?.findIndex((x) => x.id === categoryId);
    await this.http.delete(`productCategories/${categoryId}`).toPromise();
    await this.loadMenu();
  }

  async deleteProduct(productId: string) {
    await this.http.delete(`products/${productId}`).toPromise();
    await this.loadMenu();
  }

  async deleteMenuCost(id: number) {
    await this.http.delete(`menuCosts/${id}`).toPromise();
    await this.loadMenu();
  }

  async sortCategories(ids: number[]) {
    await this.http.post(`productCategories/sort`, ids).toPromise();
    await this.loadMenu();
  }

  async sortProducts(ids: string[]) {
    await this.http.post(`products/sort`, ids).toPromise();
    await this.loadMenu();
  }

  async saveProduct(dto: Product) {
    if (dto.category) {
      dto.category = <ProductCategory>{ id: dto.category.id };
    }

    const savedProduct = await this.http.post<Product>(`products`, dto).toPromise();
    await this.loadMenu();
    return savedProduct;
  }

  async saveMenuCost(dto: MenuCost) {
    dto.menu = <Menu>{ id: this.menu?.id };
    if (dto.includeProductCategory) {
      dto.includeProductCategory = dto.includeProductCategory.map((x) => <ProductCategory>{ id: x.id });
    }

    if (dto.fromDate) {
      dto.fromDate.setHours(12, 0, 0, 0);
    }

    if (dto.toDate) {
      dto.toDate.setHours(12, 0, 0, 0);
    }

    if (dto.includeProduct) {
      dto.includeProduct = dto.includeProduct.map((x) => <Product>{ id: x.id });
    }

    const saved = await this.http.post<MenuCost>(`menuCosts`, dto).toPromise();
    await this.loadMenu();
    return saved;
  }

  getProductById(id: string) {
    if (this.menu?.categories) {
      for (const cat of this.menu?.categories) {
        if (cat.products) {
          for (const p of cat.products) {
            if (p.id === id) return p;
          }
        }
      }
    }
    return undefined;
  }

  getCategoryById(id: number) {
    if (this.menu?.categories) {
      return this.menu.categories.find((x) => x.id === id);
    }
    return undefined;
  }

  filterProductsByIds(ids: string[]) {
    const res = [];
    if (this.menu?.categories) {
      for (const cat of this.menu?.categories) {
        if (cat.products) {
          for (const p of cat.products) {
            if (ids.indexOf(p.id) > -1) res.push(p);
          }
        }
      }
    }
    return res;
  }

  filterCategoriesByIds(ids: number[]) {
    const res = [];
    if (this.menu?.categories) {
      for (const cat of this.menu?.categories) {
        if (ids.indexOf(cat.id) > -1) res.push(cat);
      }
    }
    return res;
  }

  sync() {
    this.http.get('menus/sync/103').toPromise();
  }
}

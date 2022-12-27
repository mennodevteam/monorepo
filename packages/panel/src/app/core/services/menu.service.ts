import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, MenuCost, Product, ProductCategory, Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menu$: BehaviorSubject<Menu | null>;
  constructor(private http: HttpClient) {
    this.menu$ = new BehaviorSubject<Menu | null>(null);
    this.loadMenu();
  }

  async loadMenu() {
    const menu = await this.http.get<Menu>(`menus`).toPromise();
    if (menu) {
      if (menu?.categories) {
        ProductCategory.sort(menu.categories);
        for (const cat of menu.categories) {
          if (cat.products) {
            Product.sort(cat.products);
            for (const p of cat.products) {
              p.category = cat;
            }
          }
        }
      }
      if (menu.costs) {
        MenuCost.sort(menu.costs);
      }
      this.menu$.next(menu);
    }
  }

  get menuObservable() {
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

  async deleteMenuCost(id: number) {
    await this.http.delete(`menuCosts/${id}`).toPromise();
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
      dto.includeProductCategory = dto.includeProductCategory.map(
        (x) => <ProductCategory>{ id: x.id }
      );
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
}

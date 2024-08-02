import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { BusinessCategory, Menu, MenuCost, Product, ProductCategory } from '@menno/types';
import { ShopService } from './shop.service';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private _loading = new BehaviorSubject<void>(undefined);
  menu: WritableSignal<Menu>;
  currency = computed(() => {
    return this.menu()?.currency;
  });
  categories = computed(() => {
    return this.menu()?.categories || [];
  });
  costs = computed(() => {
    return this.menu()?.costs || [];
  });
  allProducts = computed(() => {
    const res = [];
    const categories = this.menu()?.categories;
    if (categories) {
      for (const cat of categories) {
        if (cat.products) {
          res.push(...cat.products);
        }
      }
    }
    return res;
  });

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private translate: TranslateService,
  ) {
    this.loadMenu();
    setInterval(() => {
      this.loadMenu();
    }, 30000);
  }

  async loadMenu() {
    try {
      const menu = await this.http.get<Menu>(`menus`).toPromise();
      if (menu) {
        Menu.setRefsAndSort(menu, undefined, true, true);
        if (this.menu) this.menu.set(menu);
        else this.menu = signal(menu);
        this._loading.complete();
      }
    } catch (ex) {}
  }

  async saveCategory(dto: Partial<ProductCategory>) {
    dto.menu = <Menu>{ id: this.menu()?.id };
    const newCat = await this.http.post<ProductCategory>(`productCategories`, dto).toPromise();
    await this.loadMenu();
    return newCat;
  }

  async deleteCategory(categoryId: number) {
    const category = this.categories()?.findIndex((x) => x.id === categoryId);
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

  async saveProduct(dto: Partial<Product>, skipLoad?: boolean) {
    if (dto.category?.id) {
      dto.category = <ProductCategory>{ id: dto.category.id };
    }
    const savedProduct = await this.http.post<Product>(`products`, dto).toPromise();
    if (dto.id) {
      const product = this.getProductById(dto.id);
      if (product) Object.assign(product, dto);
      return product;
    } else if (!skipLoad) {
      await this.loadMenu();
    }
    return savedProduct;
  }

  async saveProducts(dto: Partial<Product>[]) {
    const savedProducts = await this.http.post<Product[]>(`products/array`, dto).toPromise();
    await this.loadMenu();
    return savedProducts;
  }

  async saveMenuCost(dto: MenuCost) {
    dto.menu = <Menu>{ id: this.menu()?.id };
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
    return this.allProducts().find((x) => x.id === id);
  }

  getCategoryById(id: number) {
    return this.categories()?.find((x) => x.id === id);
  }

  filterProductsByIds(ids: string[]) {
    return this.allProducts()?.filter((x) => ids.indexOf(x.id) > -1);
  }

  filterCategoriesByIds(ids: number[]) {
    return this.categories().filter((x) => ids.indexOf(x.id) > -1);
  }

  get businessCategoryTitle() {
    return this.translate.instant(
      `menu.category.${this.shopService.shop?.businessCategory || BusinessCategory.Cafe}`,
    );
  }

  sync() {
    this.http.get('menus/sync/103').toPromise();
  }

  async getResolver() {
    if (this.menu && this.menu()?.id) return;
    return this._loading.asObservable().toPromise();
  }
}

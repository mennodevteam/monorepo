import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { Menu, Product, ProductCategory, Shop } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient, private shopService: ShopService) {}

  async saveCategory(dto: ProductCategory) {
    const shop = this.shopService.shopValue;
    dto.menu = <Menu>{ id: shop?.menu?.id };
    const newCat = await this.http.post<ProductCategory>(`productCategories`, dto).toPromise();

    if (!dto.id) {
      this.shopService.updateMenu(<Menu>{
        categories: [...(shop?.menu?.categories || []), newCat],
      });
    } else {
      const catIndex = shop?.menu?.categories?.findIndex((x) => x.id === dto.id);
      this.shopService.updateMenu(<Menu>{
        categories: shop?.menu?.categories?.map((value, index) =>
          index === catIndex ? { ...value, ...newCat } : value
        ),
      });
    }
  }

  async deleteCategory(categoryId: number) {
    const shop = this.shopService.shopValue;
    const category = shop?.menu?.categories?.findIndex((x) => x.id === categoryId);
    await this.http.delete(`productCategories/${categoryId}`).toPromise();
    this.shopService.updateMenu(<Menu>{
      categories: shop?.menu?.categories?.filter((x) => x.id !== categoryId),
    });
  }

  async saveProduct(dto: Product) {
    const menu = this.shopService.shopValue?.menu;
    const currentCategory = dto.id
      ? menu?.categories?.find((x) => x.products?.find((y) => y.id === dto.id))
      : undefined;

    if (dto.category) dto.category = <ProductCategory>{ id: dto.category.id };
    const savedProduct = await this.http.post<Product>(`products`, dto).toPromise();
    await this.shopService.loadShop();
    return savedProduct;
  }

  getProductById(id: string) {
    if (this.shopService.shopValue?.menu?.categories) {
      for (const cat of this.shopService.shopValue?.menu?.categories) {
        if (cat.products) {
          for (const p of cat.products) {
            if (p.id === id) return p;
          }
        }
      }
    }
    return undefined;
  }
}

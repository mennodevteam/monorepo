import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { Menu, ProductCategory } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient, private shop: ShopService) {}

  async addCategory(title: string) {
    const dto = new ProductCategory();
    dto.title = title;
    dto.menu = <Menu>{ id: this.shop.shopValue?.menu?.id };
    const newCat = await this.http.post<ProductCategory>(`productCategories`, dto).toPromise();

    this.shop.loadShop();
  }
}

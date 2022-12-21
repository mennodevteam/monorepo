import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { Menu, ProductCategory, Shop } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient, private shopService: ShopService) {}

  async addCategory(title: string) {
    const shop = this.shopService.shopValue;
    const dto = new ProductCategory();
    dto.title = title;
    dto.menu = <Menu>{ id: shop?.menu?.id };
    const newCat = await this.http.post<ProductCategory>(`productCategories`, dto).toPromise();

    this.shopService.update(<Shop>{
      menu: {
        ...shop?.menu,
        categories: [...(shop?.menu?.categories || []), newCat],
      },
    });
  }
}

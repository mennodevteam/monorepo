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

  get shopObservable() {
    return this.shop$.asObservable();
  }

  get shop() {
    return this.shop$.value;
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
      this.shop$.next(shop);
    }
  }

  async saveShop(dto: Shop) {
    dto.id = this.shop!.id;
    await this.http.put(`shops`, dto).toPromise();
    await this.loadShop();
  }
}

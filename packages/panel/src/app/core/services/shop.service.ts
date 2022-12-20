import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Menu, Shop } from '@menno/types';
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

  async loadShop() {
    const shop = await this.http.get<Shop>('shops').toPromise();
    if (shop) {
      this.shop$.next({ ...this.shop, ...shop });
    }
  }
}

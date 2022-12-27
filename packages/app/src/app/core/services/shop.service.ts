import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _shop: BehaviorSubject<Shop | null> = new BehaviorSubject<Shop | null>(null);

  constructor(private http: HttpClient) {
    this.load();
  }

  async load() {
    const query = location.hostname;
    if (
      !this._shop.value ||
      (this._shop.value.code !== query && this._shop.value.domain !== query)
    ) {
      this._shop.next(null);

      const shop = await this.http.get<Shop>(`shops/${query}`).toPromise();
      this._shop.next(shop || null);
    }
  }

  get shopObservable() {
    return this._shop.asObservable();
  }

  get shop() {
    return this._shop.value;
  }
}

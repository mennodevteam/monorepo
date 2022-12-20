import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private shop$: BehaviorSubject<Shop | null>;
  constructor(private http: HttpClient) {
    this.shop$ = new BehaviorSubject<Shop | null>(null);
    this.load();
  }

  get value(): Shop | null {
    return this.shop$.getValue();
  }

  get shop() {
    return this.shop$.asObservable();
  }

  async load() {
    const shop = await this.http.get<Shop>('shops').toPromise();
    if (shop) {
      this.shop$.next({ ...this.shop, ...shop });
    }
  }
}

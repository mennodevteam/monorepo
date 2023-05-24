import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

const API_PATH = 'shops';

@Injectable({
  providedIn: 'root',
})
export class ShopsService {
  private shops$ = new BehaviorSubject<Shop[] | null>(null);
  private _loading = false;
  constructor(private http: HttpClient) {
    this.load();
  }

  async load() {
    try {
      this._loading = true;
      const shops = await this.http.get<Shop[]>('shops').toPromise();
      if (shops) {
        this.shops$.next(shops);
      }
    } finally {
      this._loading = false;
    }
  }

  get shopsObservable() {
    if (!this.shops && !this._loading) this.load();
    return this.shops$.asObservable();
  }

  get shops() {
    return this.shops$.value;
  }
}

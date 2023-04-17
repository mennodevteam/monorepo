import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Shop } from '@menno/types';
import { environment } from '../../../environments/environment';
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
      this.shop$.next(shop);
    }
  }

  async saveShop(dto: Shop) {
    dto.id = this.shop!.id;
    await this.http.put(`shops`, dto).toPromise();
    await this.loadShop();
  }
  
  smsLink(phone: string): Promise<void> {
    return this.http.get<void>('shops/sendLink/' + phone).toPromise();
  }

  get appLink() {
    return this.shop?.domain || `https://${this.shop?.username}.${environment.appDomain}`;
  }
}

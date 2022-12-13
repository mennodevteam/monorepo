import { User } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';
import { Shop } from '@menno/types';
import { ShopUser } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private _shop: BehaviorSubject<Shop> = new BehaviorSubject(undefined);

  constructor(private http: HttpClient, private titleService: Title) {
    this.load();
  }

  async load(): Promise<Shop> {
    const shop = await this.http.get<Shop>(`shops`).toPromise();
    this._shop.next(shop);
    this.titleService.setTitle(`menno.ir | ${shop.title}`);
    return shop;
  }

  async update(dto: Shop): Promise<Shop> {
    dto.id = this._shop.value.id;
    const shop = await this.http.put(`shops`, dto).toPromise();
    return this.load();
  }

  get shop(): Observable<Shop> {
    return new Observable((fn) => this._shop.subscribe(fn));
  }

  get instant(): Shop {
    return this._shop.value;
  }

  getShopUsers(): Promise<ShopUser[]> {
    return this.http.get<ShopUser[]>('shopUsers').toPromise();
  }

  smsLink(phone: string): Promise<void> {
    return this.http.get<void>('shops/sendLink/' + phone).toPromise();
  }

  saveShopUser(shopUser: ShopUser): Promise<ShopUser> {
    return this.http.post<ShopUser>(`shopUsers`, shopUser).toPromise();
  }

  async removeShopUser(shopUserId: string): Promise<void> {
    await this.http.delete(`shopUsers/${shopUserId}`).toPromise();
  }
}

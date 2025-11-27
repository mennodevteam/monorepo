import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal, inject } from '@angular/core';
import { Address } from '@menno/types';
import { ShopService } from './shop.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  private http = inject(HttpClient);
  private shopService = inject(ShopService);
  private auth = inject(AuthService);

  addresses = signal<Address[] | undefined>(undefined);

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.load();
      }
    });
  }

  load() {
    this.http
      .get<Address[]>(`addresses`, {
        params: {
          shopId: this.shopService.data()?.id || '',
        },
      })
      .subscribe((addresses) => {
        addresses.sort((a, b) => b.id - a.id);
        this.addresses.set(addresses);
      });
  }

  async save(dto: Address) {
    const address = await this.http
      .post<Address>(`addresses`, dto, {
        params: {
          shopId: this.shopService.data()?.id || '',
        },
      })
      .toPromise();

    if (address)
      this.addresses.update((prevList) => {
        if (!prevList) prevList = [];
        const existIndex = prevList?.findIndex((x) => x.id === address.id);
        if (existIndex && existIndex > -1) prevList[existIndex] = address;
        else prevList.unshift(address);
        return [...prevList];
      });
    return address;
  }
}

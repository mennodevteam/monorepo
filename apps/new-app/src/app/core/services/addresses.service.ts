import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Address } from '@menno/types';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  addresses = signal<Address[] | undefined>(undefined);

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
  ) {
    this.load();
  }

  private load() {
    this.http
      .get<Address[]>(`addresses`, {
        params: {
          shopId: this.shopService.shop?.id || '',
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
          shopId: this.shopService.shop?.id || '',
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

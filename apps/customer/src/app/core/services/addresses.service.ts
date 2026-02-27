import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Address } from '@menno/types';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ShopService } from './shop.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AddressesService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly shopService = inject(ShopService);
  private readonly auth = inject(AuthService);

  readonly addressesQuery = injectQuery(() => ({
    queryKey: ['addresses', this.auth.user()?.id],
    queryFn: () =>
      firstValueFrom(
        this.http.get<Address[]>(`addresses`, {
          params: {
            shopId: this.shopService.data()?.id || '',
          },
        }),
      ).then((addresses) => addresses.sort((a, b) => b.id - a.id)),
    enabled: !this.auth.isGuestUser(),
  }));

  readonly addresses = computed(() => this.addressesQuery.data());

  async save(dto: Address) {
    const shopId = this.shopService.data()?.id || '';
    const userId = this.auth.user()?.id || '';
    const address = await this.http
      .post<Address>(`addresses`, dto, {
        params: {
          shopId,
          userId,
        },
      })
      .toPromise();

    if (address && shopId && userId) {
      this.queryClient.setQueryData<Address[]>(['addresses', userId], (prevList) => {
        const nextList = prevList ? [...prevList] : [];
        const existIndex = nextList.findIndex((x) => x.id === address.id);
        if (existIndex > -1) nextList[existIndex] = address;
        else nextList.unshift(address);
        return nextList;
      });
    }
    return address;
  }
}

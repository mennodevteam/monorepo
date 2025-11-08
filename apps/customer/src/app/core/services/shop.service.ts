import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { Shop } from '@menno/types';
import { resolveShopUsername } from '../functions';

const SHOP_QUERY_KEY = (username: string) => ['shop', username] as const;

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly username = resolveShopUsername();

  readonly shopQuery = injectQuery(() => ({
    queryKey: SHOP_QUERY_KEY(this.username),
    queryFn: () => this.fetchShop(this.username),
    refetchOnWindowFocus: false,
  }));

  prefetchShop(username: string) {
    return this.queryClient.prefetchQuery({
      queryKey: SHOP_QUERY_KEY(username),
      queryFn: () => this.fetchShop(username),
    });
  }

  readonly data = computed(() => this.shopQuery.data());

  private fetchShop(username: string) {
    return firstValueFrom(
      this.http.get<Shop>(`shops/${username}`, {
        headers: { skipJwt: 'true' },
      }),
    );
  }
}

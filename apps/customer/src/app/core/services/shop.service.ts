import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, REQUEST, computed, effect, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { OrderType, Shop } from '@menno/types';
import { resolveShopUsername } from '../functions';

const SHOP_QUERY_KEY = (username: string) => ['shop', username] as const;
const SHOP_STORAGE_KEY = (username: string) => `shop/${username}`;

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true }) as Request | null;

  private get username(): string {
    const host = this.request?.headers?.get('host')?.split(':')[0];
    return resolveShopUsername(
      host ?? (typeof window !== 'undefined' ? window.location.hostname : undefined),
    );
  }

  readonly shopQuery = injectQuery(() => ({
    queryKey: SHOP_QUERY_KEY(this.username),
    queryFn: () => this.fetchShop(this.username),
    refetchOnWindowFocus: false,
    /** SSR: use prefetch transfer-state only. Browser: refetch so shop edits show up. */
    staleTime: isPlatformServer(this.platformId) ? Number.POSITIVE_INFINITY : 0,
    initialData: () => this.readShopFromStorage(this.username),
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

  private readonly persistShop = effect(() => {
    const shop = this.shopQuery.data();
    if (shop) {
      this.writeShopToStorage(this.username, shop);
    }
  });

  private readShopFromStorage(username: string): Shop | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      const payload = window.localStorage.getItem(SHOP_STORAGE_KEY(username));
      return payload ? (JSON.parse(payload) as Shop) : undefined;
    } catch {
      return undefined;
    }
  }

  private writeShopToStorage(username: string, shop: Shop) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SHOP_STORAGE_KEY(username), JSON.stringify(shop));
    } catch {
      // Ignore storage failures (quota, private mode, etc.)
    }
  }

  isPaymentAvailable = computed(() => {
    const data = this.data();
    if (data) return Shop.isPaymentAvailable(data);
    return false;
  });

  isPaymentRequired = computed(() => {
    return this.isPaymentAvailable() && this.data()?.appConfig?.requiredPayment?.includes(OrderType.Delivery);
  });

  get isOrderingTemporaryDisabled() {
    const shop = this.data();
    return shop?.appConfig?.disableOrdering === true;
  }
}

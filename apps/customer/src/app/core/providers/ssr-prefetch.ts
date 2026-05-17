import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HomeSection, Menu, Shop } from '@menno/types';
import { menuLookupQueries, resolveShopUsername } from '../functions/resolve-shop-username';

export interface SsrPrefetchResult {
  /** Cache / transfer-state key (matches client `resolveShopUsername`). */
  username: string;
  shop: Shop;
  menu?: Menu;
  homeSections?: HomeSection[];
}

async function fetchShop(http: HttpClient, query: string): Promise<Shop | undefined> {
  const shop = await firstValueFrom(
    http.get<Shop>(`shops/${encodeURIComponent(query)}`, {
      headers: { skipJwt: 'true' },
    }),
  );
  return shop?.id ? shop : undefined;
}

async function fetchMenu(http: HttpClient, query: string): Promise<Menu | undefined> {
  const menu = await firstValueFrom(
    http.get<Menu>(`menus/${encodeURIComponent(query)}`, {
      headers: { skipJwt: 'true' },
    }),
  );
  return menu?.id ? menu : undefined;
}

async function fetchHomeSections(http: HttpClient, query: string): Promise<HomeSection[] | undefined> {
  return firstValueFrom(
    http.get<HomeSection[]>(`home-sections/${encodeURIComponent(query)}`, {
      headers: { skipJwt: 'true' },
    }),
  );
}

/** Resolve shop by host (domain / username / code) and prefetch menu + home sections when possible. */
export async function prefetchShopData(http: HttpClient, host: string): Promise<SsrPrefetchResult | null> {
  let shop: Shop | undefined;
  let apiQuery: string | undefined;

  for (const query of menuLookupQueries(host)) {
    try {
      shop = await fetchShop(http, query);
      if (shop) {
        apiQuery = query;
        break;
      }
    } catch {
      // try next lookup candidate
    }
  }

  if (!shop || !apiQuery) {
    return null;
  }

  const username = resolveShopUsername(host);
  const [menuResult, sectionsResult] = await Promise.allSettled([
    fetchMenu(http, apiQuery),
    fetchHomeSections(http, apiQuery),
  ]);

  return {
    username,
    shop,
    menu: menuResult.status === 'fulfilled' ? menuResult.value : undefined,
    homeSections: sectionsResult.status === 'fulfilled' ? sectionsResult.value : undefined,
  };
}

import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HomeSection, Menu, Shop } from '@menno/types';
import { menuLookupQueries, resolveShopUsername } from '../functions/resolve-shop-username';
import { getServerApiUrl } from '../functions/server-api-url';
import { logSsrApiConfigOnce, ssrLog } from '../functions/ssr-logger';

export interface SsrPrefetchResult {
  /** Cache / transfer-state key (matches client `resolveShopUsername`). */
  username: string;
  shop: Shop;
  menu?: Menu;
  homeSections?: HomeSection[];
}

function apiUrl(path: string): string {
  return `${getServerApiUrl()}/${path.replace(/^\//, '')}`;
}

async function fetchShop(http: HttpClient, query: string): Promise<Shop | undefined> {
  const resource = 'shop';
  const url = apiUrl(`shops/${encodeURIComponent(query)}`);
  ssrLog.fetchStart(resource, url, { query });
  try {
    const shop = await firstValueFrom(
      http.get<Shop>(`shops/${encodeURIComponent(query)}`, {
        headers: { skipJwt: 'true' },
      }),
    );
    if (shop?.id) {
      ssrLog.fetchOk(resource, { query, shopId: shop.id });
      return shop;
    }
    ssrLog.fetchFail(resource, 'empty shop response', { query });
    return undefined;
  } catch (error) {
    ssrLog.fetchFail(resource, error, { query });
    return undefined;
  }
}

async function fetchMenu(http: HttpClient, query: string): Promise<Menu | undefined> {
  const resource = 'menu';
  const url = apiUrl(`menus/${encodeURIComponent(query)}`);
  ssrLog.fetchStart(resource, url, { query });
  try {
    const menu = await firstValueFrom(
      http.get<Menu>(`menus/${encodeURIComponent(query)}`, {
        headers: { skipJwt: 'true' },
      }),
    );
    if (menu?.id) {
      ssrLog.fetchOk(resource, { query, menuId: menu.id });
      return menu;
    }
    ssrLog.fetchFail(resource, 'empty menu response', { query });
    return undefined;
  } catch (error) {
    ssrLog.fetchFail(resource, error, { query });
    throw error;
  }
}

async function fetchHomeSections(http: HttpClient, query: string): Promise<HomeSection[] | undefined> {
  const resource = 'home-sections';
  const url = apiUrl(`home-sections/${encodeURIComponent(query)}`);
  ssrLog.fetchStart(resource, url, { query });
  try {
    const sections = await firstValueFrom(
      http.get<HomeSection[]>(`home-sections/${encodeURIComponent(query)}`, {
        headers: { skipJwt: 'true' },
      }),
    );
    ssrLog.fetchOk(resource, { query, count: sections?.length ?? 0 });
    return sections;
  } catch (error) {
    ssrLog.fetchFail(resource, error, { query });
    throw error;
  }
}

/** Resolve shop by host (domain / username / code) and prefetch menu + home sections when possible. */
export async function prefetchShopData(http: HttpClient, host: string): Promise<SsrPrefetchResult | null> {
  logSsrApiConfigOnce();
  ssrLog.prefetchStart(host, { queries: menuLookupQueries(host) });

  let shop: Shop | undefined;
  let apiQuery: string | undefined;

  for (const query of menuLookupQueries(host)) {
    try {
      shop = await fetchShop(http, query);
      if (shop) {
        apiQuery = query;
        ssrLog.info('shop resolved', { host, apiQuery });
        break;
      }
    } catch {
      ssrLog.debug('shop lookup try next', { host, query });
    }
  }

  if (!shop || !apiQuery) {
    ssrLog.prefetchSkip(host, 'shop not found');
    return null;
  }

  const username = resolveShopUsername(host);
  const [menuResult, sectionsResult] = await Promise.allSettled([
    fetchMenu(http, apiQuery),
    fetchHomeSections(http, apiQuery),
  ]);

  if (menuResult.status === 'rejected') {
    ssrLog.warn('prefetch partial: menu failed', { host, apiQuery });
  }
  if (sectionsResult.status === 'rejected') {
    ssrLog.warn('prefetch partial: home-sections failed', { host, apiQuery });
  }

  const result: SsrPrefetchResult = {
    username,
    shop,
    menu: menuResult.status === 'fulfilled' ? menuResult.value : undefined,
    homeSections: sectionsResult.status === 'fulfilled' ? sectionsResult.value : undefined,
  };

  ssrLog.prefetchDone(host, {
    username,
    apiQuery,
    shopId: shop.id,
    hasMenu: Boolean(result.menu),
    homeSectionCount: result.homeSections?.length ?? 0,
  });

  return result;
}

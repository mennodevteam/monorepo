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
    return undefined;
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
    return undefined;
  }
}

/** First successful shop lookup across all host candidates (parallel). */
async function resolveShopFromQueries(
  http: HttpClient,
  queries: string[],
): Promise<{ shop: Shop; query: string } | null> {
  if (!queries.length) {
    return null;
  }

  if (queries.length === 1) {
    const shop = await fetchShop(http, queries[0]);
    return shop ? { shop, query: queries[0] } : null;
  }

  return new Promise((resolve) => {
    let pending = queries.length;
    let settled = false;

    for (const query of queries) {
      fetchShop(http, query)
        .then((shop) => {
          if (!settled && shop?.id) {
            settled = true;
            resolve({ shop, query });
            return;
          }
          pending -= 1;
          if (pending === 0 && !settled) {
            resolve(null);
          }
        })
        .catch(() => {
          pending -= 1;
          if (pending === 0 && !settled) {
            resolve(null);
          }
        });
    }
  });
}

async function fetchMenuAndSections(
  http: HttpClient,
  query: string,
): Promise<{ menu?: Menu; homeSections?: HomeSection[] }> {
  const [menu, homeSections] = await Promise.all([
    fetchMenu(http, query),
    fetchHomeSections(http, query),
  ]);
  return { menu, homeSections };
}

/** Resolve shop by host and prefetch shop + menu + home sections in parallel. */
export async function prefetchShopData(http: HttpClient, host: string): Promise<SsrPrefetchResult | null> {
  logSsrApiConfigOnce();
  const queries = menuLookupQueries(host);
  const primaryQuery = queries[0];
  if (!primaryQuery) {
    ssrLog.prefetchSkip(host, 'no lookup queries');
    return null;
  }

  const started = Date.now();
  ssrLog.prefetchStart(host, { queries, parallel: true });

  const shopPromise = resolveShopFromQueries(http, queries);
  const primaryDataPromise = fetchMenuAndSections(http, primaryQuery);

  const [shopMatch, primaryData] = await Promise.all([shopPromise, primaryDataPromise]);

  if (!shopMatch) {
    ssrLog.prefetchSkip(host, 'shop not found');
    return null;
  }

  const { shop, query: apiQuery } = shopMatch;
  ssrLog.info('shop resolved', { host, apiQuery });

  let menu = primaryData.menu;
  let homeSections = primaryData.homeSections;

  if (apiQuery !== primaryQuery) {
    ssrLog.debug('refetch menu and home-sections for resolved query', { apiQuery, primaryQuery });
    const resolvedData = await fetchMenuAndSections(http, apiQuery);
    menu = resolvedData.menu;
    homeSections = resolvedData.homeSections;
  }

  const username = resolveShopUsername(host);
  const result: SsrPrefetchResult = {
    username,
    shop,
    menu,
    homeSections,
  };

  ssrLog.prefetchDone(host, {
    username,
    apiQuery,
    shopId: shop.id,
    hasMenu: Boolean(menu),
    homeSectionCount: homeSections?.length ?? 0,
    durationMs: Date.now() - started,
  });

  return result;
}

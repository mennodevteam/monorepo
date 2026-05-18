import { Shop } from '@menno/types';
import { menuLookupQueries } from '../app/core/functions/resolve-shop-username';
import { getServerApiUrl } from '../app/core/functions/server-api-url';
import { logSsrApiConfigOnce, ssrLog } from '../app/core/functions/ssr-logger';

async function fetchShop(query: string): Promise<Shop | undefined> {
  logSsrApiConfigOnce();
  const resource = 'shop';
  const url = `${getServerApiUrl()}/shops/${encodeURIComponent(query)}`;
  ssrLog.fetchStart(resource, url, { query });
  try {
    const response = await fetch(url, {
      headers: { skipJwt: 'true' },
    });
    if (!response.ok) {
      ssrLog.fetchFail(resource, `HTTP ${response.status}`, { query });
      return undefined;
    }

    const body = await response.text();
    if (!body.trim()) {
      ssrLog.fetchFail(resource, 'empty body', { query });
      return undefined;
    }

    const shop = JSON.parse(body) as Shop;
    if (shop?.id) {
      ssrLog.fetchOk(resource, { query, shopId: shop.id });
      return shop;
    }
    ssrLog.fetchFail(resource, 'invalid shop payload', { query });
    return undefined;
  } catch (error) {
    ssrLog.fetchFail(resource, error, { query });
    return undefined;
  }
}

export async function fetchShopForHost(host: string): Promise<Shop | undefined> {
  ssrLog.info('resolve shop for host', { host, queries: menuLookupQueries(host) });
  for (const query of menuLookupQueries(host)) {
    const shop = await fetchShop(query);
    if (shop) {
      ssrLog.info('shop resolved', { host, apiQuery: query, shopId: shop.id });
      return shop;
    }
  }
  ssrLog.warn('shop not found', { host });
  return undefined;
}

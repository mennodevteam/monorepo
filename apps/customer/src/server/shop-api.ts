import { Shop } from '@menno/types';
import { menuLookupQueries } from '../app/core/functions/resolve-shop-username';

const API_URL = process.env['API_URL'] ?? 'https://api.menno.pro';

async function fetchShop(query: string): Promise<Shop | undefined> {
  const response = await fetch(`${API_URL}/shops/${encodeURIComponent(query)}`, {
    headers: { skipJwt: 'true' },
  });
  if (!response.ok) {
    return undefined;
  }

  const body = await response.text();
  if (!body.trim()) {
    return undefined;
  }

  try {
    const shop = JSON.parse(body) as Shop;
    return shop?.id ? shop : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchShopForHost(host: string): Promise<Shop | undefined> {
  for (const query of menuLookupQueries(host)) {
    const shop = await fetchShop(query);
    if (shop) {
      return shop;
    }
  }
  return undefined;
}

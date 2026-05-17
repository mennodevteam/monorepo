import { getShopFaviconUrl } from '../app/core/seo/web-app-manifest';
import { fetchShopForHost } from './shop-api';

export async function resolveFaviconRedirectUrl(host: string): Promise<string | null> {
  const shop = await fetchShopForHost(host);
  if (!shop) {
    return null;
  }

  return getShopFaviconUrl(shop) ?? null;
}

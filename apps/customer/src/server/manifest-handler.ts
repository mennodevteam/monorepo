import { buildWebAppManifest } from '../app/core/seo/web-app-manifest';
import { fetchShopForHost } from './shop-api';

const MANIFEST_CACHE_TTL_SECONDS = Number(process.env['MANIFEST_CACHE_TTL_SECONDS'] ?? 3600);

export function manifestCacheKey(host: string): string {
  return `customer-manifest:${host}`;
}

export function getManifestCacheTtl(): number {
  return MANIFEST_CACHE_TTL_SECONDS;
}

function requestBaseUrl(req: { protocol: string; get: (name: string) => string | undefined }): string {
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol || 'https';
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() ?? req.get('host');
  return `${protocol}://${host}`;
}

export async function generateManifestJson(
  host: string,
  req: { protocol: string; get: (name: string) => string | undefined },
): Promise<string | null> {
  const shop = await fetchShopForHost(host);
  if (!shop) {
    return null;
  }

  return JSON.stringify(buildWebAppManifest(shop, requestBaseUrl(req)));
}

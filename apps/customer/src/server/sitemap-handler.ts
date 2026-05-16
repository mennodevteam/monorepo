import { Menu } from '@menno/types';
import { resolveShopUsername } from '../app/core/functions/resolve-shop-username';
import { collectSitemapPaths } from '../app/core/seo/seo-paths';
import { buildSitemapXml } from '../app/core/seo/sitemap';

const API_URL = process.env['API_URL'] ?? 'https://api.menno.pro';
const SITEMAP_CACHE_TTL_SECONDS = Number(process.env['SITEMAP_CACHE_TTL_SECONDS'] ?? 3600);

export function sitemapCacheKey(host: string): string {
  return `customer-sitemap:${host}`;
}

export function getSitemapCacheTtl(): number {
  return SITEMAP_CACHE_TTL_SECONDS;
}

function requestBaseUrl(req: { protocol: string; get: (name: string) => string | undefined }): string {
  const forwardedProto = req.get('x-forwarded-proto');
  const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol || 'https';
  const host = req.get('host');
  return `${protocol}://${host}`;
}

async function fetchMenu(username: string): Promise<Menu | undefined> {
  const response = await fetch(`${API_URL}/menus/${encodeURIComponent(username)}`, {
    headers: { skipJwt: 'true' },
  });
  if (!response.ok) {
    return undefined;
  }
  return (await response.json()) as Menu;
}

export async function generateSitemapXml(
  host: string,
  req: { protocol: string; get: (name: string) => string | undefined },
): Promise<string | null> {
  const username = resolveShopUsername(host);
  const menu = await fetchMenu(username);
  if (!menu) {
    return null;
  }

  const paths = collectSitemapPaths(menu);
  return buildSitemapXml(requestBaseUrl(req), paths);
}

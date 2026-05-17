import { Menu } from '@menno/types';
import { menuLookupQueries } from '../app/core/functions/resolve-shop-username';
import { collectSitemapPaths } from '../app/core/seo/seo-paths';
import { buildSitemapXml } from '../app/core/seo/sitemap';

import { getServerApiUrl } from '../app/core/functions/server-api-url';
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
  const forwardedHost = req.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() ?? req.get('host');
  return `${protocol}://${host}`;
}

async function fetchMenu(query: string): Promise<Menu | undefined> {
  const response = await fetch(`${getServerApiUrl()}/menus/${encodeURIComponent(query)}`, {
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
    const menu = JSON.parse(body) as Menu;
    return menu?.id ? menu : undefined;
  } catch {
    return undefined;
  }
}

async function fetchMenuForHost(host: string): Promise<Menu | undefined> {
  for (const query of menuLookupQueries(host)) {
    const menu = await fetchMenu(query);
    if (menu) {
      return menu;
    }
  }
  return undefined;
}

export async function generateSitemapXml(
  host: string,
  req: { protocol: string; get: (name: string) => string | undefined },
): Promise<string | null> {
  const menu = await fetchMenuForHost(host);
  if (!menu) {
    return null;
  }

  const paths = collectSitemapPaths(menu);
  return buildSitemapXml(requestBaseUrl(req), paths);
}

import { Menu } from '@menno/types';
import { menuLookupQueries } from '../app/core/functions/resolve-shop-username';
import { collectSitemapPaths } from '../app/core/seo/seo-paths';
import { buildSitemapXml } from '../app/core/seo/sitemap';

import { getServerApiUrl } from '../app/core/functions/server-api-url';
import { logSsrApiConfigOnce, ssrLog } from '../app/core/functions/ssr-logger';
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
  logSsrApiConfigOnce();
  const resource = 'menu';
  const url = `${getServerApiUrl()}/menus/${encodeURIComponent(query)}`;
  ssrLog.fetchStart(resource, url, { query });
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

  try {
    const menu = JSON.parse(body) as Menu;
    if (menu?.id) {
      ssrLog.fetchOk(resource, { query, menuId: menu.id });
      return menu;
    }
    ssrLog.fetchFail(resource, 'invalid menu payload', { query });
    return undefined;
  } catch (error) {
    ssrLog.fetchFail(resource, error, { query });
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
  ssrLog.info('sitemap generate start', { host });
  const menu = await fetchMenuForHost(host);
  if (!menu) {
    ssrLog.warn('sitemap generate skip', { host, reason: 'menu not found' });
    return null;
  }

  const paths = collectSitemapPaths(menu);
  const xml = buildSitemapXml(requestBaseUrl(req), paths);
  ssrLog.info('sitemap generate done', { host, pathCount: paths.length });
  return xml;
}

/**
 * Crawlable Angular routes (see app.routes.ts + category/product components).
 * Canonical paths use slug when present, otherwise id — see seo-paths.ts.
 */
export const CRAWLABLE_ROUTE_PATHS = {
  home: '/',
  categoriesList: '/categories',
  /** CategoryComponent — `categories/:categoryId` */
  category: '/categories/:categoryId',
  /** ProductComponent — `categories/:categoryId/:id` */
  product: '/categories/:categoryId/:id',
  /** ProductComponent — legacy `menu/product/:id` */
  legacyProduct: '/menu/product/:id',
} as const;

/**
 * Google-compatible robots.txt Allow rules (after `Disallow: /`).
 *
 * | Page            | Example URL                          |
 * |-----------------|--------------------------------------|
 * | Home            | /                                    |
 * | Categories list | /categories                          |
 * | Category        | /categories/pizza or /categories/12  |
 * | Product         | /categories/pizza/burger             |
 * | Legacy product  | /menu/product/abc                    |
 */
export const ROBOTS_ALLOW_PATTERNS = [
  '/$',
  '/categories$',
  '/categories/*',
  '/categories/*/*',
  '/menu/product/*',
] as const;

export function isCrawlablePathname(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

  if (path === '/') {
    return true;
  }
  if (path === '/categories') {
    return true;
  }
  if (/^\/categories\/[^/]+$/.test(path)) {
    return true;
  }
  if (/^\/categories\/[^/]+\/[^/]+$/.test(path)) {
    return true;
  }
  if (/^\/menu\/product\/[^/]+$/.test(path)) {
    return true;
  }

  return false;
}

export function buildRobotsTxt(origin: string): string {
  const base = origin.replace(/\/$/, '');
  const lines = ['User-agent: *', 'Disallow: /'];

  for (const pattern of ROBOTS_ALLOW_PATTERNS) {
    lines.push(`Allow: ${pattern}`);
  }

  lines.push('', `Sitemap: ${base}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

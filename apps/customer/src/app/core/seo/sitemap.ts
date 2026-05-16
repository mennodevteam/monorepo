function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(baseUrl: string, paths: string[]): string {
  const origin = baseUrl.replace(/\/$/, '');
  const urls = paths
    .map((path) => {
      const loc = path === '/' ? origin : `${origin}${path.startsWith('/') ? path : `/${path}`}`;
      const priority = path === '/' ? '1.0' : path === '/categories' ? '0.9' : path.split('/').length <= 3 ? '0.8' : '0.7';
      const changefreq = path === '/' ? 'daily' : path.includes('/') && path.split('/').length > 3 ? 'weekly' : 'daily';
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

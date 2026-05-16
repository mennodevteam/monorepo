import 'zone.js/node';
import '@angular/compiler';
import { AngularNodeAppEngine, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { Redis } from 'ioredis';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateSitemapXml,
  getSitemapCacheTtl,
  sitemapCacheKey,
} from './src/server/sitemap-handler';

const SSR_ROUTE_PREFIXES = ['', '/categories'];
const HTML_CACHE_TTL_SECONDS = Number(process.env['SSR_HTML_CACHE_TTL_SECONDS'] ?? 300);
const REDIS_URI = process.env['REDIS_URI'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function isSsrRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '') {
    return true;
  }
  return SSR_ROUTE_PREFIXES.some(
    (prefix) => prefix !== '' && (pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );
}

function htmlCacheKey(host: string, pathname: string): string {
  return `customer-ssr-html:${host}:${pathname}`;
}

function createRedisClient(): Redis | null {
  if (!REDIS_URI) {
    return null;
  }
  try {
    return new Redis(REDIS_URI, { maxRetriesPerRequest: 1, lazyConnect: true });
  } catch {
    return null;
  }
}

export async function createApp(): Promise<express.Express> {
  const server = express();
  const distFolder = resolve(__dirname, '..');
  const browserDistFolder = join(distFolder, 'browser');
  const angularApp = new AngularNodeAppEngine();
  const redis = createRedisClient();

  if (redis) {
    await redis.connect().catch(() => undefined);
  }

  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
    }),
  );

  server.get('/robots.txt', (req, res) => {
    const forwardedProto = req.get('x-forwarded-proto');
    const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol || 'https';
    const baseUrl = `${protocol}://${req.get('host')}`;
    res
      .type('text/plain')
      .send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  server.get('/sitemap.xml', async (req, res) => {
    const host = (req.headers.host ?? '').split(':')[0];
    try {
      if (redis) {
        const cached = await redis.get(sitemapCacheKey(host));
        if (cached) {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.setHeader('X-Sitemap-Cache', 'HIT');
          res.send(cached);
          return;
        }
      }

      const xml = await generateSitemapXml(host, req);
      if (!xml) {
        res.status(404).type('text/plain').send('Shop not found');
        return;
      }

      if (redis) {
        await redis.set(sitemapCacheKey(host), xml, 'EX', getSitemapCacheTtl()).catch(() => undefined);
        res.setHeader('X-Sitemap-Cache', 'MISS');
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch {
      res.status(500).type('text/plain').send('Failed to generate sitemap');
    }
  });

  server.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const host = (req.headers.host ?? '').split(':')[0];
    const pathname = req.url?.split('?')[0] || '/';

    if (redis && isSsrRoute(pathname)) {
      try {
        const cached = await redis.get(htmlCacheKey(host, pathname));
        if (cached) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-SSR-Cache', 'HIT');
          res.send(cached);
          return;
        }
      } catch {
        // Continue without cache on Redis errors
      }
    }

    try {
      const response = await angularApp.handle(req);
      if (!response) {
        return next();
      }

      if (redis && isSsrRoute(pathname) && response.headers.get('content-type')?.includes('text/html')) {
        const html = await response.clone().text();
        try {
          await redis.set(htmlCacheKey(host, pathname), html, 'EX', HTML_CACHE_TTL_SECONDS);
          res.setHeader('X-SSR-Cache', 'MISS');
        } catch {
          // Ignore cache write failures
        }
      }

      await writeResponseToNodeResponse(response, res);
    } catch (error) {
      next(error);
    }
  });

  return server;
}

async function run(): Promise<void> {
  const port = Number(process.env['PORT'] ?? 4300);
  const app = await createApp();
  app.listen(port, () => {
    console.log(`Customer SSR server listening on http://localhost:${port}`);
  });
}

if (isMainModule(import.meta.url)) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

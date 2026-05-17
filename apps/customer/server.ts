import '@angular/compiler';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { Redis } from 'ioredis';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRequestHost } from './src/app/core/functions/request-host';
import { buildRobotsTxt } from './src/app/core/seo/crawlable-paths';
import { resolveFaviconRedirectUrl } from './src/server/favicon-handler';
import {
  generateManifestJson,
  getManifestCacheTtl,
  manifestCacheKey,
} from './src/server/manifest-handler';
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

let redisClient: Redis | null | undefined;

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

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }
  if (!REDIS_URI) {
    redisClient = null;
    return null;
  }
  try {
    redisClient = new Redis(REDIS_URI, { maxRetriesPerRequest: 1, lazyConnect: true });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

async function ensureRedisConnected(redis: Redis): Promise<void> {
  if (redis.status === 'wait') {
    await redis.connect().catch(() => undefined);
  }
}

function createApp(): express.Express {
  const server = express();
  const distFolder = resolve(__dirname, '..');
  const browserDistFolder = join(distFolder, 'browser');
  const angularApp = new AngularNodeAppEngine();

  server.get('/robots.txt', (req, res) => {
    const forwardedProto = req.get('x-forwarded-proto');
    const protocol = forwardedProto?.split(',')[0]?.trim() || req.protocol || 'https';
    const host = getRequestHost(req) ?? req.get('host') ?? 'localhost';
    const baseUrl = `${protocol}://${host}`;
    res.type('text/plain').send(buildRobotsTxt(baseUrl));
  });

  server.get('/manifest.webmanifest', async (req, res) => {
    const host = getRequestHost(req) ?? '';
    const redis = getRedis();
    try {
      if (redis) {
        await ensureRedisConnected(redis);
        const cached = await redis.get(manifestCacheKey(host));
        if (cached) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('X-Manifest-Cache', 'HIT');
          res.send(cached);
          return;
        }
      }

      const json = await generateManifestJson(host, req);
      if (!json) {
        res.status(404).type('text/plain').send('Shop not found');
        return;
      }

      if (redis) {
        await redis.set(manifestCacheKey(host), json, 'EX', getManifestCacheTtl()).catch(() => undefined);
        res.setHeader('X-Manifest-Cache', 'MISS');
      }

      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.send(json);
    } catch {
      res.status(500).type('text/plain').send('Failed to generate manifest');
    }
  });

  server.get('/favicon.ico', async (req, res) => {
    const host = getRequestHost(req) ?? '';
    try {
      const faviconUrl = await resolveFaviconRedirectUrl(host);
      if (faviconUrl) {
        res.redirect(302, faviconUrl);
        return;
      }
    } catch {
      // fall through to default favicon
    }
    res.sendFile(join(browserDistFolder, 'favicon.ico'), (error) => {
      if (error) {
        res.status(404).end();
      }
    });
  });

  server.get('/sitemap.xml', async (req, res) => {
    const host = getRequestHost(req) ?? '';
    const redis = getRedis();
    try {
      if (redis) {
        await ensureRedisConnected(redis);
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

  server.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
    }),
  );

  server.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const host = getRequestHost(req) ?? '';
    const pathname = req.url?.split('?')[0] || '/';
    const redis = getRedis();

    if (redis && isSsrRoute(pathname)) {
      try {
        await ensureRedisConnected(redis);
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
          await ensureRedisConnected(redis);
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

const app = createApp();

/**
 * Request handler used by the Angular CLI dev-server and production Node deploy.
 */
export const reqHandler = createNodeRequestHandler(app);

async function run(): Promise<void> {
  const port = Number(process.env['PORT'] ?? 4300);
  const redis = getRedis();
  if (redis) {
    await ensureRedisConnected(redis);
  }
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

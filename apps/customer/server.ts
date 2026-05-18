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
import { logSsrApiConfigOnce, ssrLog } from './src/app/core/functions/ssr-logger';
import { getServerApiUrl, getServerApiUrlSource } from './src/app/core/functions/server-api-url';

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
    ssrLog.cacheSkip('redis', 'REDIS_URI not set');
    redisClient = null;
    return null;
  }
  try {
    redisClient = new Redis(REDIS_URI, { maxRetriesPerRequest: 1, lazyConnect: true });
    ssrLog.info('redis client created');
  } catch {
    ssrLog.warn('redis client failed', { reason: 'init error' });
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
    const cacheKey = manifestCacheKey(host);
    const redis = getRedis();
    try {
      if (redis) {
        await ensureRedisConnected(redis);
        const cached = await redis.get(cacheKey);
        if (cached) {
          ssrLog.cacheHit('manifest', cacheKey, { host });
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('X-Manifest-Cache', 'HIT');
          res.send(cached);
          return;
        }
        ssrLog.cacheMiss('manifest', cacheKey, { host });
      } else {
        ssrLog.cacheSkip('manifest', 'redis unavailable', { host });
      }

      ssrLog.info('manifest generate start', { host });
      const json = await generateManifestJson(host, req);
      if (!json) {
        ssrLog.warn('manifest generate skip', { host, reason: 'shop not found' });
        res.status(404).type('text/plain').send('Shop not found');
        return;
      }

      if (redis) {
        await redis.set(cacheKey, json, 'EX', getManifestCacheTtl()).catch(() => undefined);
        ssrLog.cacheStore('manifest', cacheKey, getManifestCacheTtl(), { host });
        res.setHeader('X-Manifest-Cache', 'MISS');
      }

      ssrLog.info('manifest generate done', { host });
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.send(json);
    } catch (error) {
      ssrLog.warn('manifest generate error', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).type('text/plain').send('Failed to generate manifest');
    }
  });

  server.get('/favicon.ico', async (req, res) => {
    const host = getRequestHost(req) ?? '';
    try {
      ssrLog.info('favicon resolve start', { host });
      const faviconUrl = await resolveFaviconRedirectUrl(host);
      if (faviconUrl) {
        ssrLog.info('favicon redirect', { host, faviconUrl });
        res.redirect(302, faviconUrl);
        return;
      }
      ssrLog.debug('favicon fallback static', { host });
    } catch (error) {
      ssrLog.warn('favicon resolve error', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    res.sendFile(join(browserDistFolder, 'favicon.ico'), (error) => {
      if (error) {
        res.status(404).end();
      }
    });
  });

  server.get('/sitemap.xml', async (req, res) => {
    const host = getRequestHost(req) ?? '';
    const cacheKey = sitemapCacheKey(host);
    const redis = getRedis();
    try {
      if (redis) {
        await ensureRedisConnected(redis);
        const cached = await redis.get(cacheKey);
        if (cached) {
          ssrLog.cacheHit('sitemap', cacheKey, { host });
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.setHeader('X-Sitemap-Cache', 'HIT');
          res.send(cached);
          return;
        }
        ssrLog.cacheMiss('sitemap', cacheKey, { host });
      } else {
        ssrLog.cacheSkip('sitemap', 'redis unavailable', { host });
      }

      const xml = await generateSitemapXml(host, req);
      if (!xml) {
        res.status(404).type('text/plain').send('Shop not found');
        return;
      }

      if (redis) {
        await redis.set(cacheKey, xml, 'EX', getSitemapCacheTtl()).catch(() => undefined);
        ssrLog.cacheStore('sitemap', cacheKey, getSitemapCacheTtl(), { host });
        res.setHeader('X-Sitemap-Cache', 'MISS');
      }

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (error) {
      ssrLog.warn('sitemap error', {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
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
    const cacheKey = htmlCacheKey(host, pathname);
    const ssrRoute = isSsrRoute(pathname);

    if (redis && ssrRoute) {
      try {
        await ensureRedisConnected(redis);
        const cached = await redis.get(cacheKey);
        if (cached) {
          ssrLog.cacheHit('html', cacheKey, { host, pathname });
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-SSR-Cache', 'HIT');
          res.send(cached);
          return;
        }
        ssrLog.cacheMiss('html', cacheKey, { host, pathname });
      } catch (error) {
        ssrLog.warn('html cache read error', {
          host,
          pathname,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else if (ssrRoute) {
      ssrLog.cacheSkip('html', 'redis unavailable', { host, pathname });
    }

    const renderStarted = Date.now();
    if (ssrRoute) {
      ssrLog.renderStart(host, pathname);
    }

    try {
      const response = await angularApp.handle(req);
      if (!response) {
        ssrLog.debug('render passthrough', { host, pathname });
        return next();
      }

      if (redis && ssrRoute && response.headers.get('content-type')?.includes('text/html')) {
        const html = await response.clone().text();
        try {
          await ensureRedisConnected(redis);
          await redis.set(cacheKey, html, 'EX', HTML_CACHE_TTL_SECONDS);
          ssrLog.cacheStore('html', cacheKey, HTML_CACHE_TTL_SECONDS, { host, pathname });
          res.setHeader('X-SSR-Cache', 'MISS');
        } catch (error) {
          ssrLog.warn('html cache write error', {
            host,
            pathname,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (ssrRoute) {
        ssrLog.renderDone(host, pathname, Date.now() - renderStarted);
      }

      await writeResponseToNodeResponse(response, res);
    } catch (error) {
      if (ssrRoute) {
        ssrLog.warn('render error', {
          host,
          pathname,
          durationMs: Date.now() - renderStarted,
          error: error instanceof Error ? error.message : String(error),
        });
      }
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
    logSsrApiConfigOnce();
    ssrLog.info('server listening', {
      port,
      redis: Boolean(redis),
      htmlCacheTtlSeconds: HTML_CACHE_TTL_SECONDS,
      apiUrl: getServerApiUrl(),
      apiSource: getServerApiUrlSource(),
    });
    console.log(`Customer SSR server listening on http://localhost:${port}`);
  });
}

if (isMainModule(import.meta.url)) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

import { getServerApiUrl, getServerApiUrlSource } from './server-api-url';

const PREFIX = '[customer-ssr]';

type SsrLogMeta = Record<string, unknown>;

function isEnabled(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }
  const flag = process.env['SSR_LOG'];
  return flag !== '0' && flag !== 'false';
}

function isVerbose(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }
  const flag = process.env['SSR_LOG'];
  return flag === 'verbose' || flag === 'debug' || process.env['SSR_DEBUG'] === '1';
}

function write(level: 'log' | 'warn', message: string, meta?: SsrLogMeta): void {
  if (!isEnabled()) {
    return;
  }
  const line = meta && Object.keys(meta).length > 0 ? `${PREFIX} ${message} ${JSON.stringify(meta)}` : `${PREFIX} ${message}`;
  console[level](line);
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export const ssrLog = {
  info(message: string, meta?: SsrLogMeta): void {
    write('log', message, meta);
  },

  warn(message: string, meta?: SsrLogMeta): void {
    if (!isEnabled()) {
      return;
    }
    const line =
      meta && Object.keys(meta).length > 0 ? `${PREFIX} ${message} ${JSON.stringify(meta)}` : `${PREFIX} ${message}`;
    console.warn(line);
  },

  debug(message: string, meta?: SsrLogMeta): void {
    if (!isVerbose()) {
      return;
    }
    write('log', message, meta);
  },

  useSsrApi(apiUrl: string, source: string): void {
    this.info('use ssr api', { apiUrl, source });
  },

  cacheHit(scope: string, key: string, meta?: SsrLogMeta): void {
    this.info('cache hit', { scope, key, ...meta });
  },

  cacheMiss(scope: string, key: string, meta?: SsrLogMeta): void {
    this.info('cache miss', { scope, key, ...meta });
  },

  cacheStore(scope: string, key: string, ttlSeconds: number, meta?: SsrLogMeta): void {
    this.info('cache store', { scope, key, ttlSeconds, ...meta });
  },

  cacheSkip(scope: string, reason: string, meta?: SsrLogMeta): void {
    this.debug('cache skip', { scope, reason, ...meta });
  },

  fetchStart(resource: string, url: string, meta?: SsrLogMeta): void {
    this.info('fetch start', { resource, url, ...meta });
  },

  fetchOk(resource: string, meta?: SsrLogMeta): void {
    this.info('fetch ok', { resource, ...meta });
  },

  fetchFail(resource: string, error: unknown, meta?: SsrLogMeta): void {
    const message = error instanceof Error ? error.message : String(error);
    this.warn('fetch fail', { resource, error: message, ...meta });
  },

  prefetchStart(host: string, meta?: SsrLogMeta): void {
    this.info('prefetch start', { host, ...meta });
  },

  prefetchDone(host: string, meta?: SsrLogMeta): void {
    this.info('prefetch done', { host, ...meta });
  },

  prefetchSkip(host: string, reason: string, meta?: SsrLogMeta): void {
    this.warn('prefetch skip', { host, reason, ...meta });
  },

  renderStart(host: string, pathname: string, meta?: SsrLogMeta): void {
    this.info('render start', { host, pathname, ...meta });
  },

  renderDone(host: string, pathname: string, durationMs: number, meta?: SsrLogMeta): void {
    this.info('render done', { host, pathname, durationMs, ...meta });
  },

  hydrate(username: string, meta?: SsrLogMeta): void {
    this.debug('hydrate transfer state', { username, ...meta });
  },

  /** Run async work and log duration on success/failure. */
  async timed<T>(label: string, meta: SsrLogMeta | undefined, fn: () => Promise<T>): Promise<T> {
    const started = nowMs();
    this.debug(`${label} start`, meta);
    try {
      const result = await fn();
      this.debug(`${label} done`, { ...meta, durationMs: Math.round(nowMs() - started) });
      return result;
    } catch (error) {
      this.warn(`${label} fail`, {
        ...meta,
        durationMs: Math.round(nowMs() - started),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};

let loggedApiConfig = false;

/** Log SSR API URL config once per process. */
export function logSsrApiConfigOnce(): void {
  if (loggedApiConfig || !isEnabled()) {
    return;
  }
  loggedApiConfig = true;
  ssrLog.useSsrApi(getServerApiUrl(), getServerApiUrlSource());
}

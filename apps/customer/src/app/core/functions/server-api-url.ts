import { environment } from '../../../environments/environment';

/** Public API base URL (browser / built client). */
export function getClientApiUrl(): string {
  return environment.apiUrl.replace(/\/+$/, '');
}

export type ServerApiUrlSource = 'SSR_API_URL' | 'API_URL' | 'client';

/** Which env/config supplies the server API base URL. */
export function getServerApiUrlSource(): ServerApiUrlSource {
  if (typeof process !== 'undefined') {
    if (process.env['SSR_API_URL']) {
      return 'SSR_API_URL';
    }
    if (process.env['API_URL']) {
      return 'API_URL';
    }
  }
  return 'client';
}

/**
 * API base URL for Node (SSR prefetch, sitemap, manifest).
 * Set `SSR_API_URL` for an internal backend; falls back to `API_URL`, then client `apiUrl`.
 */
export function getServerApiUrl(): string {
  if (typeof process !== 'undefined') {
    const fromEnv = process.env['SSR_API_URL'] ?? process.env['API_URL'];
    if (fromEnv) {
      return fromEnv.replace(/\/+$/, '');
    }
  }
  return getClientApiUrl();
}

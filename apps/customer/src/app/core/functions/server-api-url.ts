import { environment } from '../../../environments/environment';

/** Public API base URL (browser / built client). */
export function getClientApiUrl(): string {
  return environment.apiUrl.replace(/\/+$/, '');
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

import { environment } from '../../../environments/environment';

const FALLBACK_USERNAME = 'maghzook';
const FALLBACK_HOSTNAME = environment.appDomain;

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0];
}

function isLocalDevHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('192.168.') ||
    (environment.systemHostNames?.includes(host) ?? false)
  );
}

function isShopLocalSubdomainHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return host.endsWith('.localhost') && host !== 'localhost';
}

function isMennoSubdomainHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host.includes('menno')) {
    return false;
  }
  if (host.startsWith('api.') || environment.systemHostNames?.includes(host)) {
    return false;
  }
  const parts = host.split('.');
  return parts.length >= 3 && parts[parts.length - 2] === 'menno';
}

export const resolveShopUsername = (hostname?: string): string => {
  const resolvedHostname =
    hostname ??
    (typeof window !== 'undefined'
      ? normalizeHostname(window.location.hostname)
      : normalizeHostname(FALLBACK_HOSTNAME));

  if (!resolvedHostname) {
    return FALLBACK_USERNAME;
  }

  if (isLocalDevHost(resolvedHostname)) {
    return typeof process !== 'undefined' && process.env['SSR_SHOP_USERNAME']
      ? process.env['SSR_SHOP_USERNAME']
      : FALLBACK_USERNAME;
  }

  if (isShopLocalSubdomainHost(resolvedHostname) || isMennoSubdomainHost(resolvedHostname)) {
    return resolvedHostname.split('.')[0] || FALLBACK_USERNAME;
  }

  return resolvedHostname.replace(/^www\./, '');
};

/** Ordered API `menus/:query` candidates (domain, username, or code). */
export function menuLookupQueries(hostname?: string): string[] {
  const host = hostname ? normalizeHostname(hostname) : '';
  const queries: string[] = [];
  const add = (value: string | undefined) => {
    if (value && !queries.includes(value)) {
      queries.push(value);
    }
  };

  if (!host) {
    add(FALLBACK_USERNAME);
    return queries;
  }

  if (isLocalDevHost(host)) {
    if (typeof process !== 'undefined') {
      add(process.env['SSR_SHOP_USERNAME']);
    }
    add(FALLBACK_USERNAME);
    return queries;
  }

  if (isShopLocalSubdomainHost(host) || isMennoSubdomainHost(host)) {
    add(host.split('.')[0]);
    return queries;
  }

  const withoutWww = host.replace(/^www\./, '');
  add(withoutWww);
  if (withoutWww !== host) {
    add(host);
  }

  return queries;
}

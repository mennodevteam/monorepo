import { environment } from '../../../environments/environment';

const FALLBACK_USERNAME = 'lime-golestan';
const FALLBACK_HOSTNAME = environment.appDomain;

export const resolveShopUsername = (hostname?: string): string => {
  const resolvedHostname =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : FALLBACK_HOSTNAME);

  if (!resolvedHostname) {
    return FALLBACK_USERNAME;
  }

  if (resolvedHostname.includes('menno') || !environment.production) {
    const subdomain = resolvedHostname.split('.')[0];
    return subdomain === '192' ? FALLBACK_USERNAME : subdomain;
  }

  return resolvedHostname;
};


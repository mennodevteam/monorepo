import { Shop } from '@menno/types';
import { environment } from '../../../environments/environment';
import { getFileUrl } from '../functions/get-file-url';

export interface WebAppManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebAppManifest {
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
  display: 'standalone';
  scope: string;
  start_url: string;
  icons: WebAppManifestIcon[];
}

const DEFAULT_ICONS: WebAppManifestIcon[] = [
  { src: `${environment.appBaseUrl}assets/icons/icon-72x72.png`, sizes: '72x72', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-96x96.png`, sizes: '96x96', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-128x128.png`, sizes: '128x128', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-144x144.png`, sizes: '144x144', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-152x152.png`, sizes: '152x152', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-384x384.png`, sizes: '384x384', type: 'image/png', purpose: 'any' },
  { src: `${environment.appBaseUrl}assets/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
];

export function getShopFaviconUrl(shop: Shop): string | undefined {
  const key = shop.logoImage?.sm || shop.logoImage?.xs || shop.logo;
  return key ? getFileUrl(key) : undefined;
}

function manifestIconsForShop(shop: Shop): WebAppManifestIcon[] {
  if (shop.logoImage?.xxs) {
    return [
      { src: getFileUrl(shop.logoImage.xxs), sizes: '64x64', type: 'image/png', purpose: 'any' },
      { src: getFileUrl(shop.logoImage.xs), sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: getFileUrl(shop.logoImage.sm), sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: getFileUrl(shop.logoImage.md), sizes: '512x512', type: 'image/png', purpose: 'any' },
    ];
  }

  if (shop.logo) {
    const src = getFileUrl(shop.logo);
    return [{ src, sizes: '256x256', type: 'image/png', purpose: 'any' }];
  }

  return DEFAULT_ICONS;
}

export function buildWebAppManifest(shop: Shop, baseUrl: string): WebAppManifest {
  const origin = baseUrl.replace(/\/$/, '');
  const themeColor =
    shop.appConfig?.themeHex?.trim() ||
    shop.appConfig?.theme?.primaryColor?.trim() ||
    '#000000';

  return {
    name: shop.title,
    short_name: shop.title,
    theme_color: themeColor,
    background_color: '#ffffff',
    display: 'standalone',
    scope: `${origin}/`,
    start_url: `${origin}/`,
    icons: manifestIconsForShop(shop),
  };
}

import { Injectable, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getFileUrl } from '../functions/get-file-url';
import { ShopService } from './shop.service';

const MENNO_ICONS = [
  { src: `${environment.appBaseUrl}assets/icons/icon-72x72.png`, sizes: '72x72', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-96x96.png`, sizes: '96x96', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-128x128.png`, sizes: '128x128', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-144x144.png`, sizes: '144x144', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-152x152.png`, sizes: '152x152', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-384x384.png`, sizes: '384x384', type: 'image/png', purpose: 'any' as const },
  { src: `${environment.appBaseUrl}assets/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' as const },
];

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  manifest: unknown;
  onDeferredPrompted = new Subject<void>();
  deferredPrompt: unknown;

  private readonly shopService = inject(ShopService);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.onDeferredPrompted.next();
      });
    }

    effect(() => {
      const shop = this.shopService.data();
      if (shop) this.setManifest(shop);
    });
  }

  private setManifest(shop: { title: string; logo?: string; logoImage?: { xxs?: string; xs?: string; sm?: string; md?: string } }) {
    let manifestIcons: { src: string; sizes: string; type: string; purpose?: string }[];
    let shopIcon: string | undefined;

    try {
      if (shop.logoImage?.xxs) {
        manifestIcons = [
          { src: getFileUrl(shop.logoImage.xxs), sizes: '64x64', type: 'image/png', purpose: 'any' },
          { src: getFileUrl(shop.logoImage.xs), sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: getFileUrl(shop.logoImage.sm), sizes: '256x256', type: 'image/png', purpose: 'any' },
          { src: getFileUrl(shop.logoImage.md), sizes: '512x512', type: 'image/png', purpose: 'any' },
        ];
      } else if (shop.logo) {
        shopIcon = getFileUrl(shop.logo);
        manifestIcons = [{ src: shopIcon, sizes: '256x256', type: 'image/png' }];
      } else {
        manifestIcons = MENNO_ICONS;
      }
    } catch {
      manifestIcons = MENNO_ICONS;
    }

    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue('--shop-main-color').trim() || '#000000';
    const background = getComputedStyle(root).getPropertyValue('--shop-background-color').trim() || '#ffffff';

    const myDynamicManifest = {
      name: shop.title,
      short_name: shop.title,
      theme_color: primary,
      background_color: background,
      display: 'standalone',
      scope: location.origin,
      start_url: location.origin,
      icons: manifestIcons,
    };

    const stringManifest = JSON.stringify(myDynamicManifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    document.querySelector<HTMLLinkElement>('#my-manifest-placeholder')?.setAttribute('href', manifestURL);

    this.manifest = myDynamicManifest;

    if (shopIcon) {
      document.getElementById('app-favicon')?.setAttribute('href', shopIcon);
    }
  }

  install(): void {
    const prompt = this.deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null;
    if (prompt) {
      prompt.prompt();
      prompt.userChoice
        .then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            this.deferredPrompt = null;
          }
        })
        .catch(() => {
          /* User dismissed or prompt failed */
        });
    }
  }

  get isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }
}

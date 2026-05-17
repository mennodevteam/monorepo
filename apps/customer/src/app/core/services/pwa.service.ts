import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Shop } from '@menno/types';
import { getShopFaviconUrl } from '../seo/web-app-manifest';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  manifest: unknown;
  onDeferredPrompted = new Subject<void>();
  deferredPrompt: unknown;

  private readonly shopService = inject(ShopService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.onDeferredPrompted.next();
      });
    }

    effect(() => {
      const shop = this.shopService.data();
      if (shop && this.isBrowser) {
        this.applyShopAssets(shop);
      }
    });
  }

  private applyShopAssets(shop: Shop): void {
    document.querySelector<HTMLLinkElement>('#my-manifest-placeholder')?.setAttribute('href', '/manifest.webmanifest');

    const favicon = getShopFaviconUrl(shop);
    if (favicon) {
      document.getElementById('app-favicon')?.setAttribute('href', favicon);
    }
  }

  install(): void {
    if (!this.isBrowser) {
      return;
    }

    const prompt = this.deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null;
    if (prompt) {
      prompt.prompt();
      prompt.userChoice
        .then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            this.deferredPrompt = null;
          }
        })
        .catch(() => undefined);
    }
  }

  get isStandalone(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return window.matchMedia('(display-mode: standalone)').matches;
  }
}

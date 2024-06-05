import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Shop } from '@menno/types';
import { Title } from '@angular/platform-browser';
import { FilesService } from './files.service';

const MENNO_ICONS = [
  {
    src: `${environment.appBaseUrl}assets/icons/icon-72x72.png`,
    sizes: '72x72',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-96x96.png`,
    sizes: '96x96',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-128x128.png`,
    sizes: '128x128',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-144x144.png`,
    sizes: '144x144',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-152x152.png`,
    sizes: '152x152',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-192x192.png`,
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-384x384.png`,
    sizes: '384x384',
    type: 'image/png',
    purpose: 'maskable any',
  },
  {
    src: `${environment.appBaseUrl}assets/icons/icon-512x512.png`,
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable any',
  },
];

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  manifest: any;
  onDefferedPromped = new Subject<void>();
  deferredPrompt: any;

  constructor(private fileService: FilesService, private Title: Title) {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      this.onDefferedPromped.next();
    });
  }

  async setManifest(shop: Shop, url: string, theme = '#000000', themeBackground = '#ffffff'): Promise<void> {
    // check shop has valid icon
    let manifestIcons: any;
    let shopIcon: string | undefined;
    try {
      shopIcon = this.fileService.getFileUrl(shop.logo);
      manifestIcons = [
        {
          src: shopIcon,
          sizes: '256x256',
          type: 'image/png',
        },
      ];
    } catch (error) {
      manifestIcons = MENNO_ICONS;
    }

    // create and add manifest
    const myDynamicManifest = {
      name: shop.title,
      short_name: shop.title,
      theme_color: theme,
      background_color: themeBackground,
      display: 'standalone',
      scope: url,
      start_url: url,
      icons: manifestIcons,
    };
    const stringManifest = JSON.stringify(myDynamicManifest);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    document.querySelector('#my-manifest-placeholder')?.setAttribute('href', manifestURL);
    setTimeout(() => {
      this.manifest = myDynamicManifest;
    }, 3000);

    if (shopIcon) {
      document.getElementById('app-favicon')?.setAttribute('href', shopIcon);
    }

    this.Title.setTitle(shop.title);
  }

  install(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      this.deferredPrompt.userChoice
        .then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            this.deferredPrompt = null;
          }
        })
        .catch((error: any) => {});
    }
  }
}

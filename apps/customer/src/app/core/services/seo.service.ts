import { DOCUMENT } from '@angular/common';
import { Injectable, REQUEST, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Product, Shop } from '@menno/types';
import { getFileUrl } from '../functions/get-file-url';
import { PageSeoConfig } from '../seo/page-seo.builder';
import { buildProductJsonLd } from '../seo/product-json-ld';

const PRODUCT_JSON_LD_ID = 'product-json-ld';
const CANONICAL_LINK_ID = 'canonical-link';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true }) as Request | null;

  applyShopDefaults(shop: Shop): void {
    const favicon = shop.logoImage?.sm || shop.logo;
    if (favicon) {
      this.setFavicon(getFileUrl(favicon));
    }
  }

  applyPageSeo(config: PageSeoConfig): void {
    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });

    const canonical = this.buildAbsoluteUrl(config.path);
    if (canonical) {
      this.meta.updateTag({ property: 'og:url', content: canonical });
      this.setCanonical(canonical);
    }

    if (config.image) {
      const imageUrl = this.toAbsoluteUrl(config.image);
      this.meta.updateTag({ property: 'og:image', content: imageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    }
  }

  applyProductStructuredData(product: Product, shop: Shop, productPath: string): void {
    const pageUrl = this.buildAbsoluteUrl(productPath);
    if (!pageUrl) {
      return;
    }
    this.setJsonLd(PRODUCT_JSON_LD_ID, buildProductJsonLd(product, shop, pageUrl));
  }

  clearProductStructuredData(): void {
    this.removeJsonLd(PRODUCT_JSON_LD_ID);
  }

  buildAbsoluteUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (this.request?.url) {
      return new URL(normalizedPath, this.request.url).href;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}${normalizedPath}`;
    }

    return '';
  }

  private toAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (this.request?.url) {
      return new URL(url, this.request.url).href;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
    }
    return url;
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link#${CANONICAL_LINK_ID}`);
    if (!link) {
      link = this.document.createElement('link');
      link.id = CANONICAL_LINK_ID;
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = href;
  }

  private setJsonLd(id: string, data: Record<string, unknown>): void {
    this.removeJsonLd(id);
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(id: string): void {
    this.document.getElementById(id)?.remove();
  }

  private setFavicon(href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link#app-favicon, link[rel="icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      link.id = 'app-favicon';
      head.appendChild(link);
    }
    link.href = href;
  }
}

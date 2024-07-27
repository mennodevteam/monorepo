import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Meta, Title } from '@angular/platform-browser';
import { FilesService } from './files.service';
import { ThemeService } from './theme.service';
import { ShopService } from './shop.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private meta: Meta,
    private menuService: MenuService,
    private Title: Title,
    private shopService: ShopService,
    private translate: TranslateService,
    private fileService: FilesService,
  ) {
    this.shopService.getResolver().then(() => {
      const shop = this.shopService.shop;
      const description = this.translate.instant('seo.description', {
        title: shop.title,
        address: shop.address || '',
        phone: shop.phones.join(', '),
        menuTitle: this.menuService.businessCategoryTitle,
        shopTitle: this.shopService.businessCategoryTitle,
      });

      const logo = this.fileService.getFileUrl(shop.logoImage?.xs || shop.logo);

      this.Title.setTitle(shop.title);
      this.meta.addTag({ name: 'description', content: description });
      this.meta.addTag({ name: 'og:description', content: description });
      this.meta.addTag({ name: 'twitter:description', content: description });
      this.meta.addTag({ name: 'og:site_name', content: shop.title });
      this.meta.addTag({ name: 'og:type', content: 'website' });
      this.meta.addTag({ name: 'og:locale', content: 'fa_IR' });
      this.meta.addTag({ name: 'og:image', content: logo });
      this.meta.addTag({ name: 'twitter:card', content: 'summary_large_image' });
      this.meta.addTag({ name: 'twitter:type', content: 'website' });
      this.meta.addTag({ name: 'twitter:site', content: shop.title });
      this.meta.addTag({ name: 'og:url', content: location.origin });
      

      const favIconElem: HTMLLinkElement | null = document.querySelector('#favicon');
      if (favIconElem) favIconElem.href = logo;
    });
  }
}

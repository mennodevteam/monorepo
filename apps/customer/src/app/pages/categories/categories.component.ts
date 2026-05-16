import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { ShopService } from '../../core/services/shop.service';
import { SeoService } from '../../core/services/seo.service';
import { buildCategoriesPageSeo } from '../../core/seo/page-seo.builder';
import { ImageLoaderDirective } from '../../shared/directives';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatGridListModule, RouterLink, ImageLoaderDirective],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly menuService = inject(MenuService);
  private readonly shopService = inject(ShopService);
  private readonly seoService = inject(SeoService);

  readonly menuQuery = this.menuService.menuQuery;
  readonly categories = computed(() => this.menuService.data()?.categories ?? []);
  readonly hasCategories = computed(() => this.categories().length > 0);

  constructor() {
    effect(() => {
      const shop = this.shopService.data();
      if (shop) {
        this.seoService.applyPageSeo(buildCategoriesPageSeo(shop));
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, effect } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MenuService } from '../../core/services/menu.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ShopService } from '../../core/services/shop.service';
import { TitleService } from '../../core/services/title.service';
import { MenuViewType } from '@menno/types';

@Component({
  selector: 'app-category',
  imports: [MatProgressSpinner, ProductCardComponent, MatGridListModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent implements OnDestroy {
  MenuViewType = MenuViewType;
  private readonly menuService = inject(MenuService);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(TitleService);

  private readonly categoryIdParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('categoryId'))),
    { initialValue: this.route.snapshot.paramMap.get('categoryId') },
  );

  readonly categoryId = computed(() => {
    const value = this.categoryIdParam();
    if (value == null) {
      return null;
    }
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  });

  readonly category = computed(() => {
    const param = this.categoryIdParam();
    const menu = this.menuService.data();
    if (param == null || !menu) {
      return undefined;
    }
    // Try to find by slug first, then by id
    const bySlug = menu.categories?.find((item) => item.slug === param);
    if (bySlug) return bySlug;
    const id = Number(param);
    if (Number.isFinite(id)) {
      return menu.categories?.find((item) => item.id === id);
    }
    return undefined;
  });

  readonly categoryType = computed(
    () =>
      this.category()?.menuViewType ?? this.shopService.data()?.appConfig?.menuViewType ?? MenuViewType.Grid,
  );

  readonly isGrid = computed(() => this.categoryType() === MenuViewType.Grid);
  readonly isCard = computed(
    () => this.categoryType() === MenuViewType.Card || this.categoryType() === MenuViewType.CardLargeImage,
  );

  readonly products = computed(() => this.category()?.products ?? []);
  readonly hasProducts = computed(() => this.products().length > 0);
  readonly isLoading = computed(() => !this.menuService.data());

  constructor() {
    effect(() => {
      const category = this.category();
      this.titleService.setTitle(category?.title);
    });
  }

  ngOnDestroy(): void {
    this.titleService.clearTitle();
  }
}

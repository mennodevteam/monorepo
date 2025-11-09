import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { HomeToolbarComponent } from '../home/toolbar/toolbar.component';
import { MenuService } from '../../core/services/menu.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-category',
  imports: [HomeToolbarComponent, MatProgressSpinner, ProductCardComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent {
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);

  readonly menuQuery = this.menuService.menuQuery;

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
    const id = this.categoryId();
    const menu = this.menuService.data();
    if (id == null || !menu) {
      return undefined;
    }
    return menu.categories?.find((item) => item.id === id);
  });

  readonly products = computed(() => this.category()?.products ?? []);
  readonly hasProducts = computed(() => this.products().length > 0);
  readonly isLoading = computed(() => this.menuQuery.isPending());
  readonly isError = computed(() => this.menuQuery.isError());
  readonly isNotFound = computed(
    () => !this.isLoading() && !this.isError() && this.category() == null,
  );

}


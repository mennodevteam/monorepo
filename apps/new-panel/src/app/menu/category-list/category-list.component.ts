import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuService } from '../menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCost, ProductCategory, Status } from '@menno/types';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ShopService } from '../../shop/shop.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { ActivatedRoute, Router } from '@angular/router';

const COLS = ['index', 'title', 'costs', 'status', 'actions'];

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    StatusChipComponent,
    EmptyStateComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly shop = inject(ShopService);
  readonly menuService = inject(MenuService);
  readonly displayedColumns = COLS;
  Status = Status;

  editCategory(category?: ProductCategory) {
    this.router.navigate(['./edit'], {
      relativeTo: this.route,
      queryParams: category ? { id: category.id } : {},
    });
  }

  openSortCategoriesDialog() {
    const categories = this.menuService.categories();
    if (categories)
      this.dialog
        .sort(
          this.t.instant('menu.sortCategories'),
          categories.map((item) => ({ id: item.id, text: item.title })),
        )
        .then((data) => {
          if (data) this.menuService.sortCategoriesMutation.mutate(data.map((x: ProductCategory) => x.id));
        });
  }

  editCost(cost: MenuCost) {
    //
  }

  changeStatus(category: ProductCategory, status: Status) {
    this.menuService.saveCategoryMutation.mutate({ id: category.id, status });
  }

  async deleteCategory(category: ProductCategory) {
    const confirmed = await this.dialog.alert(
      this.t.instant('app.confirmDelete'),
      this.t.instant('app.deleteConfirmMessage', { value: category.title }),
      { config: { data: { confirm: true } } },
    );

    if (confirmed) {
      this.menuService.deleteCategoryMutation.mutate(category.id);
    }
  }
}

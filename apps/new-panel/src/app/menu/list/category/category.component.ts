import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { Product, ProductCategory, Status } from '@menno/types';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProductTableComponent } from './table/table.component';
import { MenuStatusChipComponent } from '../../status-chip/status-chip.component';
import { MenuService } from '../../menu.service';
import { SortDialogComponent } from '../../../shared/dialogs/sort-dialog/sort-dialog.component';
import { DialogService } from '../../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-menu-category',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatToolbarModule,
    ProductTableComponent,
    MenuStatusChipComponent,
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class MenuCategoryComponent {
  private readonly dialog = inject(DialogService);
  private readonly menu = inject(MenuService);
  private readonly t = inject(TranslateService);
  category = input<ProductCategory>();
  categoryEditClick = output<ProductCategory | undefined>();
  statusChange(status: Status) {
    this.menu.saveCategoryMutation.mutate({ id: this.category()!.id, status });
  }

  openSortItemsDialog() {
    const category = this.category();
    if (category?.products)
      this.dialog
        .sort(
          this.t.instant('menu.sortProducts', { value: category.title }),
          category.products?.map((item) => ({ id: item.id, text: item.title })),
        )
        .then((data) => {
          if (data)
            this.menu.sortProductsMutation.mutate({
              ids: data.map((x: Product) => x.id),
              categoryId: category.id,
            });
        });
  }
}

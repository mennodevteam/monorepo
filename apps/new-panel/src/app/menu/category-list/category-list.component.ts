import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuService } from '../menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCost, ProductCategory, Status } from '@menno/types';
import { MatDialog } from '@angular/material/dialog';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MenuStatusChipComponent } from '../status-chip/status-chip.component';
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
    MenuStatusChipComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  private readonly matDialog = inject(MatDialog);
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  readonly menuService = inject(MenuService);
  readonly displayedColumns = COLS;
  Status = Status;

  editCategory(category?: ProductCategory) {
    this.matDialog.open(CategoryFormDialogComponent, {
      data: category,
      width: '360px',
      disableClose: true,
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
}

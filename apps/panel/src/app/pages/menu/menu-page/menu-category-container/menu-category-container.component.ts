import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProductCategory, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../../../core/services/menu.service';
import { AlertDialogComponent } from '../../../../shared/dialogs/alert-dialog/alert-dialog.component';
import { SortDialogComponent } from '../../../../shared/dialogs/sort-dialog/sort-dialog.component';
import { AnalyticsService } from 'apps/panel/src/app/core/services/analytics.service';

@Component({
  selector: 'menu-category-container',
  templateUrl: './menu-category-container.component.html',
  styleUrls: ['./menu-category-container.component.scss'],
})
export class MenuCategoryContainerComponent {
  Status = Status;
  @Input() category: ProductCategory;

  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
    private translate: TranslateService,
    private analytics: AnalyticsService,
  ) {}

  deleteCategory() {
    this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('menu.deleteCategoryAlert.title', {
            value: this.category.title,
          }),
          description: this.translate.instant('menu.deleteCategoryAlert.description'),
        },
      })
      .afterClosed()
      .subscribe((val) => {
        if (val) {
          this.menuService.deleteCategory(this.category.id);
          this.analytics.event('delete product category');
        }
      });
  }

  openSort() {
    this.dialog
      .open(SortDialogComponent, {
        data: this.category.products?.map((x) => ({ key: x.id, value: x.title })),
        disableClose: true,
      })
      .afterClosed()
      .subscribe((items) => {
        if (items) {
          this.menuService.sortProducts(items.map((x: any) => x.key));
          this.analytics.event('sort products');
        }
      });
  }

  changeStar(star: number | null) {
    this.menuService.saveCategory({ id: this.category.id, star } as ProductCategory);

    this.analytics.event('set star for category');
  }
}

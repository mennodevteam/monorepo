import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProductCategory, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'packages/panel/src/app/core/services/menu.service';
import { AlertDialogComponent } from 'packages/panel/src/app/shared/dialogs/alert-dialog/alert-dialog.component';

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
    private translate: TranslateService
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
        }
      });
  }
}

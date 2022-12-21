import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProductCategory } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'packages/panel/src/app/core/services/menu.service';
import { PromptDialogComponent } from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { CategoryEditDialogComponent } from '../category-edit-dialog/category-edit-dialog.component';

@Component({
  selector: 'menno-menu-toolbar',
  templateUrl: './menu-toolbar.component.html',
  styleUrls: ['./menu-toolbar.component.scss'],
})
export class MenuToolbarComponent {
  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private menuService: MenuService
  ) {}

  addCategory() {
    this.dialog
      .open(CategoryEditDialogComponent)
      .afterClosed()
      .subscribe((category: ProductCategory) => {
        if (category) {
          this.menuService.saveCategory(category);
        }
      });
  }
}

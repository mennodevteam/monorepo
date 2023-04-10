import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProductCategory } from '@menno/types';
import { map } from 'rxjs';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { CategoryEditDialogComponent } from './category-edit-dialog/category-edit-dialog.component';

@Component({
  selector: 'menno-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent {
  constructor(
    private dialog: MatDialog,
    private menuService: MenuService,
    private shopService: ShopService
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
  get categories() {
    console.log(this.menuService.menu);
    return this.menuService.menu?.categories;
  }
}

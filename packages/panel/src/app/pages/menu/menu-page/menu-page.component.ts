import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { Status } from '@menno/types';
import { SortDialogComponent } from '../../../shared/dialogs/sort-dialog/sort-dialog.component';

@Component({
  selector: 'menno-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent {
  Status = Status;
  constructor(private menuService: MenuService, private dialog: MatDialog) {}

  get categories() {
    return this.menuService.menu?.categories;
  }

  openSort() {
    this.dialog
      .open(SortDialogComponent, {
        data: this.menuService.menu?.categories?.map((x) => ({ key: x.id, value: x.title })),
        disableClose: true,
      })
      .afterClosed()
      .subscribe((items) => {
        if (items) {
          this.menuService.sortCategories(items.map((x: any) => x.key));
        }
      });
  }
}

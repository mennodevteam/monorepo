import { Component, Input } from '@angular/core';
import { OrderType, Product, Status } from '@menno/types';
import { AlertDialogService } from 'packages/panel/src/app/core/services/alert-dialog.service';
import { MenuService } from 'packages/panel/src/app/core/services/menu.service';

@Component({
  selector: 'products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
})
export class ProductsTableComponent {
  displayedColumns = ['image', 'title', 'price', 'actions'];
  @Input() products: Product[];
  Status = Status;
  OrderType = OrderType;

  abs = Math.abs;

  constructor(private alertDialog: AlertDialogService, private menuService: MenuService) {}

  deleteProduct(p: Product) {
    this.alertDialog.removeItem(p.title).then((v) => {
      if (v) {
        this.menuService.deleteProduct(p.id);
      }
    });
  }
}

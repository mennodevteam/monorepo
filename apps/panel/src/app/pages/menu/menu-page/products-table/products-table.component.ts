import { Component, Input } from '@angular/core';
import { OrderType, Product, Status } from '@menno/types';
import { AlertDialogService } from '../../../../core/services/alert-dialog.service';
import { MenuService } from '../../../../core/services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
})
export class ProductsTableComponent {
  displayedColumns = ['image', 'title', 'price', 'status', 'stock', 'actions'];
  @Input() products: Product[];
  Status = Status;
  OrderType = OrderType;

  abs = Math.abs;

  constructor(
    private alertDialog: AlertDialogService,
    private menuService: MenuService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  deleteProduct(p: Product) {
    this.alertDialog.removeItem(p.title).then((v) => {
      if (v) {
        this.menuService.deleteProduct(p.id);
      }
    });
  }

  async changeStatus(product: Product, status: Status) {
    if (product.status !== status) {
      product._changingStatus = true;
      try {
        await this.menuService.saveProduct({ id: product.id, status });
        product.status = status;
      } catch (error) {
      } finally {
        product._changingStatus = false;
      }
    }
  }

  async changeStock(product: Product, infinity?: boolean) {
    let stock = infinity ? null : 0;
    if (!infinity) {
      const dto = await this.dialog
        .open(PromptDialogComponent, {
          data: {
            title: this.translate.instant('productTable.stockDialog.title', { value: product.title }),
            description: this.translate.instant('productTable.stockDialog.description'),
            type: 'number',
          },
        })
        .afterClosed()
        .toPromise();
      if (dto == undefined || dto < 0) return;
      stock = dto;
    }

    product._changingStatus = true;
    try {
      await this.menuService.saveProduct({ id: product.id, stock });
      product.stock = stock;
    } catch (error) {
    } finally {
      product._changingStatus = false;
    }
  }
}

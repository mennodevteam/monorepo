import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { OrderStateChipComponent } from '../../state-chip/state-chip.component';
import { Router } from '@angular/router';
import { ShopService } from '../../../shop/shop.service';
import { OrdersService } from '../../order.service';
import { FormControl } from '@angular/forms';
import { DialogService } from '../../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import {
  TableColsDialogComponent,
  TableColsVisibility,
} from '../../../shared/dialogs/table-cols-dialog/table-cols-dialog.component';
import { MatDialog } from '@angular/material/dialog';

const COLS = ['createdAt', 'customer', 'type', 'price', 'state', 'actions'];
const RESTAURANT_COLS = ['createdAt', 'type', 'customer', 'price', 'state', 'actions'];
const ALL_COLS = [
  'createdAt',
  'customer',
  'type',
  'price',
  'materialCost',
  'extraCosts',
  'profit',
  'state',
  'actions',
];
const STORAGE_TABLE_COLS_KEY = 'ordersTableCols';

@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, OrderStateChipComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent {
  private readonly router = inject(Router);
  private readonly shopService = inject(ShopService);
  orders = input<Order[]>();
  stateChange = output<{ order: Order; state: OrderState }>();
  delete = output<Order>();
  displayedColumns = this.shopService.isRestaurantOrCoffeeShop() ? RESTAURANT_COLS : COLS;
  User = User;
  OrderType = OrderType;
  private readonly orderService = inject(OrdersService);
  private readonly dialogService = inject(DialogService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  navigateToOrder(order: Order) {
    this.router.navigate(['/orders/details', order.id], {
      state: {
        order,
      },
    });
  }

  setExtraCosts(orderId: string) {
    this.dialogService
      .prompt(
        this.translate.instant('order.extraCosts'),
        {
          value: {
            label: this.translate.instant('order.extraCosts'),
            control: new FormControl(0),
            type: 'number',
            eng: true,
            ltr: true,
            hint: this.translate.instant('app.currency'),
          },
        },
        {
          description: this.translate.instant('order.extraCostsDescription'),
        },
      )
      .then((result) => {
        if (result) {
          this.orderService.setExtraCostsMutation.mutate({ orderId, extraCosts: result.value });
        }
      });
  }

  extraCostHint() {
    this.dialogService.alert(
      this.translate.instant('app.unknown'),
      this.translate.instant('order.unknownMaterialCostDescription'),
      {
        config: {
          data: {
            hideCancel: true,
          },
        },
      },
    );
  }

  get localCols(): string[] {
    const local = localStorage.getItem(STORAGE_TABLE_COLS_KEY);
    if (local) {
      const data = JSON.parse(local);
      return data[location.pathname] || [];
    }
    return [];
  }

  get visibleCols(): string[] {
    return this.localCols.length ? this.localCols : this.displayedColumns;
  }

  openColSettings() {
    const textMap: { [key: string]: string } = {
      createdAt: this.translate.instant('app.date'),
      customer: this.translate.instant('order.customer'),
      type: this.translate.instant('app.type'),
      price: this.translate.instant('order.price'),
      state: this.translate.instant('app.status'),
      actions: this.translate.instant('app.actions'),
      materialCost: this.translate.instant('order.materialCost'),
      extraCosts: this.translate.instant('order.extraCosts'),
      profit: this.translate.instant('order.totalProfit'),
    };

    const cols: TableColsVisibility[] = ALL_COLS.map((col) => ({
      text: textMap[col],
      visible: this.visibleCols.includes(col),
    }));

    this.dialog
      .open(TableColsDialogComponent, {
        data: cols,
        disableClose: true,
      })
      .afterClosed()
      .subscribe((dto: TableColsVisibility[]) => {
        if (dto) {
          const result = dto
            .filter((item) => item.visible)
            .map((item) => Object.keys(textMap).find((key) => textMap[key] === item.text)!);

          const local = localStorage.getItem(STORAGE_TABLE_COLS_KEY);
          let data: { [key: string]: string[] } = {};
          if (local) {
            data = JSON.parse(local);
          }
          data[location.pathname] = result;

          localStorage.setItem(STORAGE_TABLE_COLS_KEY, JSON.stringify(data));
        }
      });
  }
}

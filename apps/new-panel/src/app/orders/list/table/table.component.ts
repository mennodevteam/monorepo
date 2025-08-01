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

const COLS = ['createdAt', 'customer', 'type', 'price', 'state', 'actions'];
const RESTAURANT_COLS = ['createdAt', 'type', 'customer', 'price', 'state', 'actions'];
const ALL_COLS = ['createdAt', 'customer', 'type', 'price', 'materialCost', 'extraCosts', 'profit', 'state', 'actions'];
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
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);

  navigateToOrder(order: Order) {
    this.router.navigate(['/orders/details', order.id], {
      state: {
        order,
      },
    });
  }

  setExtraCosts(orderId: string) {
    this.dialog
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
    this.dialog.alert(
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
}

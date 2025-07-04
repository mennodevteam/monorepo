import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { OrderStateChipComponent } from '../../state-chip/state-chip.component';
import { Router } from '@angular/router';
import { ShopService } from '../../../shop/shop.service';
const COLS = ['createdAt', 'customer', 'type', 'price', 'state', 'actions'];
const RESTAURANT_COLS = ['createdAt', 'type', 'customer', 'price', 'state', 'actions'];
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

  navigateToOrder(order: Order) {
    this.router.navigate(['/orders/details', order.id], {
      state: {
        order,
      },
    });
  }
}

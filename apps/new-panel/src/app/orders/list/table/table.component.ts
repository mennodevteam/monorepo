import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { OrderStateChipComponent } from '../../state-chip/state-chip.component';
import { Router } from '@angular/router';
const COLS = ['createdAt', 'type', 'customer', 'price', 'state', 'actions'];
@Component({
  selector: 'app-order-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, OrderStateChipComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent {
  private readonly router = inject(Router);
  orders = input<Order[]>();
  stateChange = output<{ id: string; state: OrderState }>();
  displayedColumns = COLS;
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

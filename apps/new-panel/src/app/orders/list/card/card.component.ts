import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { OrderStateChipComponent } from '../../state-chip/state-chip.component';
import { Router } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-order-card-view',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, OrderStateChipComponent, MatRippleModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  private readonly router = inject(Router);
  orders = input<Order[]>();
  stateChange = output<{ order: Order; state: OrderState }>();
  User = User;
  OrderType = OrderType;

  navigateToOrder(order: Order) {
    this.router.navigate(['/orders/details', order.id], {
      state: { order },
    });
  }
} 
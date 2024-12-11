import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { OrderItemTableComponent } from './table/table.component';
import { OrderStateChipComponent } from '../state-chip/state-chip.component';
import { OrdersService } from '../order.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatToolbarModule,
    OrderItemTableComponent,
    OrderStateChipComponent,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly ordersService = inject(OrdersService);
  User = User;
  OrderType = OrderType;
  orderId = signal(this.route.snapshot.params['id']);
  query = injectQuery(() => ({
    queryKey: ['orderDetails', this.orderId()],
    queryFn: () => lastValueFrom(this.http.get<Order>(`/orders/panel/${this.orderId()}`)),
    enabled: !!this.orderId(),
  }));
  order = computed<Order | undefined>(() => {
    return this.query.data() || this.router.getCurrentNavigation()?.extras?.state?.['order'];
  });

  constructor() {
    effect(() => {
      this.route.paramMap.subscribe((params) => {
        this.orderId.set(params.get('id'));
      });
    });
  }

  stateChange(state: OrderState) {
    const id = this.orderId();
    if (id)
      this.ordersService.changeStateMutation.mutate({
        id,
        state,
      });
  }
}

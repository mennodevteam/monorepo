import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Order, OrderType, User } from '@menno/types';
import { OrderItemTableComponent } from './table/table.component';
import { OrderStateChipComponent } from "../state-chip/state-chip.component";

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatToolbarModule, OrderItemTableComponent, OrderStateChipComponent],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  User = User;
  OrderType = OrderType;
  orderId = signal(this.route.snapshot.params['id']);
  query = injectQuery(() => ({
    queryKey: ['ordersDetails', this.orderId()],
    queryFn: () => lastValueFrom(this.http.get<Order>(`/orders/panel/${this.orderId()}`)),
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
}

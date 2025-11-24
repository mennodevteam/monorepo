import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { OrderItemTableComponent } from './table/table.component';
import { OrderStateChipComponent } from '../state-chip/state-chip.component';
import { OrdersService } from '../order.service';
import { OrderChatComponent } from './chat/order-chat.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormsModule } from '@angular/forms';
import { CostSummaryComponent } from './cost-summary/cost-summary.component';

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
    OrderChatComponent,
    MatTooltipModule,
    MatCheckboxModule,
    FormsModule,
    CostSummaryComponent,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly queryClient = inject(QueryClient);
  readonly ordersService = inject(OrdersService);
  User = User;
  OrderType = OrderType;
  orderId = signal(this.route.snapshot.params['id']);
  isSmallScreen = signal(false);
  showCost = signal(false);
  private readonly breakpointObserver = inject(BreakpointObserver);
  query = injectQuery(() => ({
    queryKey: ['orderDetails', this.orderId()],
    queryFn: () => lastValueFrom(this.http.get<Order>(`/orders/panel/${this.orderId()}`)),
    enabled: !!this.orderId(),
  }));
  order = computed<Order | undefined>(() => {
    return this.query.data() || this.router.currentNavigation()?.extras?.state?.['order'];
  });

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe((result) => {
      this.isSmallScreen.set(result.matches);
    });    
    effect(() => {
      this.route.paramMap.subscribe((params) => {
        this.orderId.set(params.get('id'));
      });
    });

    effect(() => {
      this.order();
      this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

  onShowCostChange(value: boolean) {
    this.showCost.set(value);
  }

}

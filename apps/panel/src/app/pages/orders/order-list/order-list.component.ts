import { Component, computed, inject, signal } from '@angular/core';
import { injectInfiniteQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { OrdersService } from '../../../core/services/orders.service';
import { FilterOrderDto, Order, OrderState, UserAction } from '@menno/types';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const TAKE_COUNT = 20;

@Component({
  selector: 'order-list',
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  auth = inject(AuthService);
  ordersService = inject(OrdersService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  OrderState = OrderState;

  queryClient = injectQueryClient();
  state = signal<'all' | 'complete' | 'pending' | 'deleted'>('all');
  filter = computed(() => {
    const state = this.state();
    const dto: FilterOrderDto = {};
    switch (state) {
      case 'all':
        dto.states = [
          OrderState.Completed,
          OrderState.Pending,
          OrderState.Processing,
          OrderState.Ready,
          OrderState.Shipping,
        ];
        break;
      case 'complete':
        dto.states = [OrderState.Completed];
        break;
      case 'pending':
        dto.states = [OrderState.Pending, OrderState.Processing, OrderState.Ready, OrderState.Shipping];
        break;
      case 'deleted':
        dto.withDeleted = true;
        break;
    }
    return dto;
  });

  ordersQuery = injectInfiniteQuery(() => ({
    queryKey: ['orders/list'],
    queryFn: ({ pageParam }) =>
      this.ordersService.filter({ take: TAKE_COUNT, skip: pageParam, withDeleted: true }),
    initialPageParam: 0,
    getNextPageParam: (orders) => orders?.length ?? 0,
    refetchInterval: 30000,
  }));

  data = computed(() => {
    try {
      const pages = this.ordersQuery.data()?.pages;
      let orders = pages ? (pages as Order[][]).reduce((acc, val) => acc.concat(val), []) : [];

      const state = this.state();
      switch (state) {
        case 'all':
          orders = orders.filter(
            (x) =>
              [
                OrderState.Completed,
                OrderState.Pending,
                OrderState.Processing,
                OrderState.Ready,
                OrderState.Shipping,
              ].includes(x.state) && !x.deletedAt,
          );
          break;
        case 'complete':
          orders = orders.filter((x) => x.state === OrderState.Completed && !x.deletedAt);
          break;
        case 'pending':
          orders = orders.filter(
            (x) =>
              [OrderState.Pending, OrderState.Processing, OrderState.Ready, OrderState.Shipping].includes(
                x.state,
              ) && !x.deletedAt,
          );
          break;
        case 'deleted':
          orders = orders.filter((x) => x.deletedAt);
          break;
      }
      return orders;
    } catch (error) {
      return [];
    }
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['state']) this.state.set(params['state']);
    });
  }

  orderClicked(order: Order) {
    this.router.navigateByUrl(`/orders/details/${order.id}`, { state: { order } });
  }

  get accessReport() {
    return this.auth.hasAccess(UserAction.Report);
  }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FilterOrderDto, Order, OrderState, User } from '@menno/types';
import { TableComponent } from './table/table.component';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../order.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { SearchMemberAutocompleteComponent } from '../../shared/components/search-member-autocomplete/search-member-autocomplete.component';

const DEFAULT_STATES = [
  OrderState.Pending,
  OrderState.Processing,
  OrderState.Ready,
  OrderState.Shipping,
  OrderState.Completed,
  OrderState.Canceled,
];

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    TableComponent,
    MatCardModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatChipsModule,
    SearchMemberAutocompleteComponent,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class OrderListComponent {
  private readonly http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  DEFAULT_STATES = DEFAULT_STATES;
  private queryParams = this.route.snapshot.queryParams;
  currentPage = signal(Number(this.queryParams['page'] || 0));
  currentSize = signal(Number(this.queryParams['size'] || 10));
  OrderState = OrderState;
  statesFilter = signal<OrderState[]>(
    this.queryParams['states']?.split(',')?.map((x: string) => Number(x)) || DEFAULT_STATES,
  );
  customerFilter = signal<string | undefined>(this.queryParams['customer']);
  filterDto = computed<FilterOrderDto>(() => ({
    take: this.currentSize(),
    skip: this.currentPage() * this.currentSize(),
    states: this.statesFilter(),
    customerId: this.customerFilter() || undefined,
    withCount: true,
  }));
  query = injectQuery(() => ({
    queryKey: ['orders', this.filterDto()],
    queryFn: () => lastValueFrom(this.http.post<[Order[], number]>('/orders/filter', this.filterDto())),
  }));

  pageSize = computed(() => {
    return this.query.data()?.[1] || 0;
  });

  constructor() {
    effect(() => {
      this.router.navigate([], {
        replaceUrl: true,
        queryParams: {
          page: this.currentPage(),
          size: this.currentSize(),
          customer: this.customerFilter(),
          states: this.statesFilter()?.join(','),
        },
      });
    });
  }

  pageChange(ev: PageEvent) {
    const { previousPageIndex, pageIndex, pageSize } = ev;
    if (previousPageIndex !== pageIndex) {
      this.currentPage.set(pageIndex);
    } else if (pageSize) {
      this.currentSize.set(pageSize);
    }
  }

  stateChange(order: Order, state: OrderState) {
    this.ordersService.changeStateMutation.mutate({
      id: order.id,
      state,
      customer: order.customer,
      queryKey: ['orders', this.filterDto()],
    });
  }
}

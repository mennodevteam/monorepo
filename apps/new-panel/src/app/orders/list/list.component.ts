import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FilterOrderDto, Order, OrderState } from '@menno/types';
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
    this.queryParams['states'] ? JSON.parse(this.queryParams['states']) : DEFAULT_STATES,
  );
  filterDto = computed<FilterOrderDto>(() => ({
    take: this.currentSize(),
    skip: this.currentPage() * this.currentSize(),
    states: this.statesFilter(),
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
          states: JSON.stringify(this.statesFilter()),
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

  stateChange(dto: { id: string; state: OrderState }) {
    this.ordersService.changeStateMutation.mutate({ ...dto, queryKey: ['orders', this.filterDto()] });
  }
}

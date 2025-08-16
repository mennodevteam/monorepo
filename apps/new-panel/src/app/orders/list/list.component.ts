import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';

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
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CardComponent } from './card/card.component';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

const SCROLL_STORAGE_KEY = 'orderList_scrollPosition';

const DEFAULT_STATES = [
  OrderState.Pending,
  OrderState.Processing,
  OrderState.Ready,
  OrderState.Shipping,
  OrderState.Completed,
];

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
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
    CardComponent,
    MatDatepickerModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class OrderListComponent {
  private readonly http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  private dialog = inject(DialogService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly t = inject(TranslateService);
  DEFAULT_STATES = DEFAULT_STATES;
  private queryParams = this.route.snapshot.queryParams;
  currentPage = signal(Number(this.queryParams['page'] || 0));
  currentSize = signal(Number(this.queryParams['size'] || 25));
  OrderState = OrderState;
  statesFilter = signal<OrderState[]>(
    this.queryParams['states']?.split(',')?.map((x: string) => Number(x)) || DEFAULT_STATES,
  );
  fromDate = signal<Date | undefined>(
    this.queryParams['fromDate'] ? new Date(this.queryParams['fromDate']) : undefined,
  );
  toDate = signal<Date | undefined>(
    this.queryParams['toDate'] ? new Date(this.queryParams['toDate']) : undefined,
  );
  customerFilter = signal<string | undefined>(this.queryParams['customer']);
  dateFilter = computed(() => {
    const fromDate = (this.fromDate() as any)?._d || this.fromDate();
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }
    const toDate = (this.toDate() as any)?._d || this.toDate();
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    return { fromDate, toDate };
  });
  filterDto = computed<FilterOrderDto>(() => ({
    take: this.currentSize(),
    skip: this.currentPage() * this.currentSize(),
    states: this.statesFilter(),
    customerId: this.customerFilter() || undefined,
    withCount: true,
    ...this.dateFilter(),
  }));
  query = injectQuery(() => ({
    queryKey: ['orders', this.filterDto()],
    queryFn: () => lastValueFrom(this.http.post<[Order[], number]>('/orders/filter/v2', this.filterDto())),
    staleTime: 30 * 60 * 1000,
  }));

  pageSize = computed(() => {
    return this.query.data()?.[1] || 0;
  });

  isMobile = signal(false);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).subscribe((result) => {
      this.isMobile.set(result.matches);
    });

    // Restore scroll position
    const scrollPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, Number(scrollPosition));
      }, 20);
    }

    effect(() => {
      this.router.navigate([], {
        replaceUrl: true,
        queryParams: {
          page: this.currentPage(),
          size: this.currentSize(),
          customer: this.customerFilter(),
          states: this.statesFilter()?.join(','),
          fromDate: this.fromDate()?.toISOString(),
          toDate: this.toDate()?.toISOString(),
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
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
  }

  stateChange(order: Order, state: OrderState) {
    this.ordersService.changeStateMutation.mutate({
      id: order.id,
      state,
      customer: order.customer,
      queryKey: ['orders', this.filterDto()],
    });
  }

  delete(order: Order) {
    this.dialog.alert(this.t.instant('app.delete'), this.t.instant('app.deleteConfirm')).then((result) => {
      if (result) {
        this.ordersService.deleteMutation.mutate(order.id);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
  }
}

import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';

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
import { CardComponent } from './card/card.component';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import {
  OrderListExtraFiltersDialogComponent,
  OrderListExtraFiltersDialogData,
  OrderListExtraFiltersDialogResult,
} from './order-list-extra-filters-dialog.component';
import { ORDER_LIST_DEFAULT_STATES } from './order-list-default-states';

const SCROLL_STORAGE_KEY = 'orderList_scrollPosition';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    TableComponent,
    MatCardModule,
    MatPaginatorModule,
    CardComponent,
    MatBadgeModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
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
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslateService);

  readonly DEFAULT_STATES = ORDER_LIST_DEFAULT_STATES;
  private queryParams = this.route.snapshot.queryParams;
  currentPage = signal(Number(this.queryParams['page'] || 0));
  currentSize = signal(Number(this.queryParams['size'] || 25));
  OrderState = OrderState;
  statesFilter = signal<OrderState[]>(
    this.queryParams['states']?.split(',')?.map((x: string) => Number(x)) || [...ORDER_LIST_DEFAULT_STATES],
  );
  fromDate = signal<Date | undefined>(
    this.queryParams['fromDate'] ? new Date(this.queryParams['fromDate']) : undefined,
  );
  toDate = signal<Date | undefined>(
    this.queryParams['toDate'] ? new Date(this.queryParams['toDate']) : undefined,
  );
  customerFilter = signal<string | undefined>(this.queryParams['customer']);
  referrerFilter = signal<string>(typeof this.queryParams['referrer'] === 'string' ? this.queryParams['referrer'] : '');
  campaignFilter = signal<string>(typeof this.queryParams['campaign'] === 'string' ? this.queryParams['campaign'] : '');

  dateFilter = computed(() => {
    const fromDateValue = this.fromDate();
    const fromDate =
      fromDateValue && typeof fromDateValue === 'object' && '_d' in fromDateValue
        ? (fromDateValue as { _d?: Date })._d || fromDateValue
        : fromDateValue;
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }
    const toDateValue = this.toDate();
    const toDate =
      toDateValue && typeof toDateValue === 'object' && '_d' in toDateValue
        ? (toDateValue as { _d?: Date })._d || toDateValue
        : toDateValue;
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
    detailsReferrer: this.referrerFilter().trim() || undefined,
    detailsCampaign: this.campaignFilter().trim() || undefined,
  }));

  /** Badge on «more filters»: customer, attribution, or non-default states (not date range) */
  extraFiltersBadgeCount = computed(() => {
    let n = 0;
    if (this.customerFilter()) n++;
    if (this.referrerFilter().trim()) n++;
    if (this.campaignFilter().trim()) n++;
    const sf = this.statesFilter();
    const def = ORDER_LIST_DEFAULT_STATES;
    if (sf.length !== def.length || !def.every((s) => sf.includes(s))) n++;
    return n;
  });

  hasActiveFilters = computed(
    () => !!(this.fromDate() || this.toDate()) || this.extraFiltersBadgeCount() > 0,
  );

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
          referrer: this.referrerFilter().trim() || undefined,
          campaign: this.campaignFilter().trim() || undefined,
        },
      });
    });
  }

  clearAllFilters() {
    this.fromDate.set(undefined);
    this.toDate.set(undefined);
    this.customerFilter.set(undefined);
    this.referrerFilter.set('');
    this.campaignFilter.set('');
    this.statesFilter.set([...ORDER_LIST_DEFAULT_STATES]);
    this.currentPage.set(0);
  }

  openExtraFiltersDialog() {
    const data: OrderListExtraFiltersDialogData = {
      customerId: this.customerFilter(),
      states: [...this.statesFilter()],
      referrer: this.referrerFilter(),
      campaign: this.campaignFilter(),
    };
    this.matDialog
      .open<OrderListExtraFiltersDialogComponent, OrderListExtraFiltersDialogData, OrderListExtraFiltersDialogResult | undefined>(
        OrderListExtraFiltersDialogComponent,
        {
          width: 'min(calc(100vw - 24px), 560px)',
          maxWidth: '100vw',
          maxHeight: '90vh',
          autoFocus: 'first-tabbable',
          data,
        },
      )
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        this.customerFilter.set(r.customerId);
        this.statesFilter.set([...r.states]);
        this.referrerFilter.set(r.referrer ?? '');
        this.campaignFilter.set(r.campaign ?? '');
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

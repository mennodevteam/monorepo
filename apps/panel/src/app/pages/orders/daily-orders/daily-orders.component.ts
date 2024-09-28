import { Component, computed, effect, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Order, OrderPaymentType, OrderState, OrderType, UserAction } from '@menno/types';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopService } from '../../../core/services/shop.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrdersService } from '../../../core/services/orders.service';
import { injectQuery } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'daily-orders',
  templateUrl: './daily-orders.component.html',
  styleUrl: './daily-orders.component.scss',
})
export class DailyOrdersComponent {
  dateControl = new FormControl(new Date());
  grouping = false;
  selectedOrders: Order[] = [];
  savingGroup = false;

  ordersQuery = injectQuery(() => ({
    queryKey: ['orders/daily', this.isToday() ? 'today' : this.dateString()],
    queryFn: () => this.ordersService.filter(this.dateFilterRange()),
    refetchInterval: this.isToday() ? 30000 : false,
    refetchOnMount: false,
  }));
  today = new Date();
  date = signal(new Date());
  dateString = computed(() => {
    const date = this.date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  });
  dateFilterRange = computed(() => {
    const date = this.date();
    const fromDate = new Date(date);
    fromDate.setHours(0, 0, 0, 0);
    if (this.shopService.isRestaurantOrCoffeeShop) fromDate.setHours(fromDate.getHours() + 3);
    const toDate = new Date(date);
    toDate.setHours(23, 59, 59, 999);
    if (this.shopService.isRestaurantOrCoffeeShop) toDate.setHours(toDate.getHours() + 3);
    return { fromDate, toDate };
  });
  isToday = computed(() => {
    return this.date().toDateString() === this.today.toDateString();
  });
  stateFilter = signal('all');
  tableFilter = signal<string | null>(null);
  typeFilter = signal<OrderType | null>(null);

  orders = computed(() => {
    let data = this.ordersQuery.data();
    if (data) {
      switch (this.stateFilter()) {
        case 'all':
          data = data.filter((x) => !x.deletedAt);
          break;
        case 'pending':
          data = data.filter((x) => !x.deletedAt && x.state === OrderState.Pending);
          break;
        case 'complete':
          data = data.filter((x) => !x.deletedAt && x.state === OrderState.Completed);
          break;
        case 'notPayed':
          data = data.filter((x) => !x.deletedAt && !x.paymentType);
          break;
        case 'payed':
          data = data.filter((x) => !x.deletedAt && x.paymentType);
          break;
        case 'edited':
          data = data.filter((x) => !x.deletedAt && x.details.itemChanges?.length);
          break;
        case 'deleted':
          data = data.filter((x) => x.deletedAt && !x.mergeTo);
          break;
      }

      if (this.tableFilter()) data = data.filter((x) => x.details.table === this.tableFilter());
      if (this.typeFilter() != null) data = data.filter((x) => x.type === this.typeFilter());
      return data;
    }
    return [];
  });

  totalPrice = computed(() => {
    let orders = this.ordersQuery.data();
    if (orders) {
      orders = orders.filter((o) => !o.deletedAt && o.state != OrderState.Canceled);
      let total = 0;
      for (const o of orders) {
        total += o.totalPrice;
      }
      return total;
    }
    return 0;
  });

  payedTotalPrice = computed(() => {
    let orders = this.ordersQuery.data();
    if (orders) {
      orders = orders.filter(
        (o) =>
          !o.deletedAt &&
          o.state != OrderState.Canceled &&
          [OrderPaymentType.Cash, OrderPaymentType.ClubWallet, OrderPaymentType.Online].indexOf(
            o.paymentType,
          ) > -1,
      );
      let total = 0;
      for (const o of orders) {
        total += o.totalPrice;
      }
      return total;
    }
    return 0;
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private shopService: ShopService,
    public auth: AuthService,
    private ordersService: OrdersService,
  ) {
    if (this.shopService.isRestaurantOrCoffeeShop) this.today.setHours(this.today.getHours() - 3);
    this.dateControl.valueChanges.subscribe((value: any) => {
      if (value) {
        this.date.set(value._d ? new Date(value._d) : value ? new Date(value) : new Date());
      }
    });

    this.route.queryParams.subscribe((params) => {
      if (params['date']) this.dateControl.setValue(new Date(params['date']));
      if (params['state']) this.stateFilter.set(params['state']);
      if (params['table']) this.tableFilter.set(params['table']);
    });

    effect(() => {
      const qp = JSON.parse(JSON.stringify(this.route.snapshot.queryParams || {}));
      qp.date = this.dateString();
      qp.state = this.stateFilter();
      qp.table = this.tableFilter();
      this.router.navigate([], {
        queryParams: qp,
        replaceUrl: true,
      });
    });
  }

  get tables() {
    return this.shopService.shop?.details.tables || [];
  }

  get accessReport() {
    return this.auth.hasAccess(UserAction.Report);
  }

  goToPrevDate() {
    const date = new Date(this.date());
    date.setDate(date.getDate() - 1);
    this.dateControl.setValue(date);
  }

  goToNextDate() {
    const date = new Date(this.date());
    date.setDate(date.getDate() + 1);
    this.dateControl.setValue(date);
  }

  goToToday() {
    this.dateControl.setValue(this.today);
  }

  orderClicked(order: Order) {
    if (this.grouping) {
      if (order.deletedAt) return;
      this.selectedOrders.push(order);
      order._selected = true;
    } else {
      this.router.navigateByUrl(`/orders/details/${order.id}`, { state: { order } });
    }
  }

  cancelGrouping() {
    this.selectedOrders.forEach((x) => (x._selected = false));
    this.selectedOrders = [];
    this.grouping = false;
  }

  async mergeGroup() {
    this.savingGroup = true;
    try {
      await this.ordersService.merge(this.selectedOrders);
      // await this.OS.loadData(true);
      this.selectedOrders = [];
      this.grouping = false;
    } catch (error) {
    } finally {
      this.savingGroup = false;
    }
  }
}

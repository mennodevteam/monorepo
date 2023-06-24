import { Injectable } from '@angular/core';
import { Order, OrderState, OrderType } from '@menno/types';
import { BehaviorSubject, filter, map, take } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { TodayOrdersService } from '../../core/services/today-orders.service';

export type DailyOrderStateFilter =
  | 'all'
  | 'pending'
  | 'complete'
  | 'notPayed'
  | 'payed'
  | 'edited'
  | 'deleted';
export type DailyOrderFilter = {
  date: Date;
  state: DailyOrderStateFilter;
  type?: OrderType;
  table?: string;
};

@Injectable({
  providedIn: 'root',
})
export class DailyOrderListService {
  private _filter: DailyOrderFilter = {
    date: this.today,
    state: 'all',
  };
  private _loading = false;

  allOrders: Order[] = [];
  orders = new BehaviorSubject<Order[]>([]);

  constructor(private ordersService: OrdersService, private todayOrders: TodayOrdersService) {
    this.todayOrders.onNewOrder.subscribe(() => {
      if (this.isToday) {
        this.allOrders = this.todayOrders.orders;
        this.setData();
      }
    });

    this.todayOrders.onUpdateOrder.subscribe(() => {
      if (this.isToday) {
        this.setData();
      }
    });
  }

  get date() {
    return this._filter.date;
  }

  get filter() {
    return this._filter;
  }

  get loading() {
    return this._loading;
  }

  get today() {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return date;
  }

  get isToday() {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return this.date.toDateString() === date.toDateString();
  }

  setFilter(value: Partial<DailyOrderFilter>) {
    this._filter = { ...this.filter, ...value };
    if (value.date) {
      this.loadData();
    } else {
      this.setData();
    }
  }

  async loadData() {
    if (this.isToday) {
      this._loading = true;
      if (!this.todayOrders.orders) {
        await this.todayOrders.ordersObservable
          .pipe(filter((x) => x != null))
          .pipe(take(1))
          .toPromise();
      }
      if (this.todayOrders.orders) {
        this.allOrders = this.todayOrders.orders;
        this.setData();
      }
      this._loading = false;
    } else {
      const fromDate = new Date(this.date);
      fromDate.setHours(0, 0, 0, 0);
      fromDate.setHours(fromDate.getHours() + 3);
      const toDate = new Date(this.date);
      toDate.setHours(23, 59, 59, 999);
      toDate.setHours(toDate.getHours() + 3);
      this._loading = true;
      const orders = await this.ordersService.filter({
        fromDate,
        toDate,
      });

      if (orders) {
        this.allOrders = orders;
        this.setData();
      }
      this._loading = false;
    }
  }

  private setData() {
    let orders: Order[];
    switch (this.filter.state) {
      case 'all':
        orders = this.allOrders.filter((x) => !x.deletedAt);
        break;
      case 'pending':
        orders = this.allOrders.filter((x) => !x.deletedAt && x.state === OrderState.Pending);
        break;
      case 'complete':
        orders = this.allOrders.filter((x) => !x.deletedAt && x.state === OrderState.Completed);
        break;
      case 'notPayed':
        orders = this.allOrders.filter((x) => !x.deletedAt && !x.paymentType);
        break;
      case 'payed':
        orders = this.allOrders.filter((x) => !x.deletedAt && x.paymentType);
        break;
      case 'edited':
        orders = this.allOrders.filter((x) => !x.deletedAt);
        break;
      case 'deleted':
        orders = this.allOrders.filter((x) => x.deletedAt);
        break;
    }

    if (this.filter.table) orders = orders.filter((x) => x.details.table === this.filter.table);
    if (this.filter.type != undefined) orders = orders.filter((x) => x.type === this.filter.type);
    this.orders.next(orders);
  }

  get totalPrice() {
    let total = 0;
    for (const o of this.allOrders) {
      if (!o.deletedAt && o.state != OrderState.Canceled) total += o.totalPrice;
    }
    return total;
  }
}

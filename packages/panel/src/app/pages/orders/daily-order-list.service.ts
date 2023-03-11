import { Injectable } from '@angular/core';
import { Order, OrderState } from '@menno/types';
import { BehaviorSubject, filter, map, take } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { TodayOrdersService } from '../../core/services/today-orders.service';

export type DailyOrderFilter = 'all' | 'pending' | 'complete' | 'notPayed' | 'payed' | 'edited' | 'deleted';

@Injectable({
  providedIn: 'root',
})
export class DailyOrderListService {
  private _date = this.today;
  private _filter: DailyOrderFilter = 'all';
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
    return this._date;
  }

  set date(value: Date) {
    this._date = value;
    this.loadData();
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

  set filter(value) {
    this._filter = value;
    this.setData();
  }

  async loadData() {
    if (this.isToday) {
      this._loading = true;
      await this.todayOrders.ordersObservable
        .pipe(filter((x) => x != null))
        .pipe(take(1))
        .toPromise();

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
    switch (this.filter) {
      case 'all':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt));
        break;
      case 'pending':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt && x.state === OrderState.Pending));
        break;
      case 'complete':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt && x.state === OrderState.Completed));
        break;
      case 'notPayed':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt && !x.paymentType));
        break;
      case 'payed':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt && x.paymentType));
        break;
      case 'edited':
        this.orders.next(this.allOrders.filter((x) => !x.deletedAt));
        break;
      case 'deleted':
        this.orders.next(this.allOrders.filter((x) => x.deletedAt));
        break;
    }
  }
}

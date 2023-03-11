import { EventEmitter, Injectable } from '@angular/core';
import { Order } from '@menno/types';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrdersService } from './orders.service';
import { SwPush } from '@angular/service-worker';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TodayOrdersService {
  private _orders = new BehaviorSubject<Order[] | undefined>(undefined);
  private lastUpdate: Date;

  onNewOrder = new EventEmitter<void>();
  onUpdateOrder = new EventEmitter<void>();

  constructor(private ordersService: OrdersService, private swPush: SwPush, private auth: AuthService) {
    this.loadData();
    setInterval(() => {
      this.loadData();
    }, 10000);

    this.swPush.messages.subscribe((message: any) => {
      try {
        if (message.notification.data.newOrder) this.loadData();
      } catch (error) {}
    });
  }

  get today() {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return date;
  }

  get orders() {
    return this._orders.value || [];
  }

  get ordersObservable() {
    return this._orders.asObservable();
  }

  async loadData() {
    if (!this.auth.instantUser) return;
    const fromDate = new Date(this.today);
    fromDate.setHours(0, 0, 0, 0);
    fromDate.setHours(fromDate.getHours() + 3);
    const toDate = new Date(this.today);
    toDate.setHours(23, 59, 59, 999);
    toDate.setHours(toDate.getHours() + 3);
    const updatedAt = this.lastUpdate ? new Date(this.lastUpdate) : undefined;
    this.lastUpdate = new Date();
    const orders = await this.ordersService.filter({
      fromDate,
      toDate,
      updatedAt,
    });

    if (orders) {
      let hasNewOrder = false;
      for (const ord of orders) {
        const existOrd = this.orders.find((x) => x.id === ord.id);
        if (existOrd) {
          Object.assign(existOrd, ord);
        } else {
          hasNewOrder = true;
          const newList = this.orders;
          newList.unshift(ord);
          this._orders.next(newList);
        }
      }
      if (orders.length) {
        if (hasNewOrder) this.onNewOrder.emit();
        else this.onUpdateOrder.emit();
      }
    }
  }

  getById(id: string): Order | undefined {
    try {
      return this._orders.value?.find((x) => x.id === id);
    } catch (error) {}
    return;
  }
}

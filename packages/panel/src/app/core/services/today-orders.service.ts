import { EventEmitter, Injectable } from '@angular/core';
import { Order, OrderState, OrderType } from '@menno/types';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import { OrdersService } from './orders.service';
import { SwPush } from '@angular/service-worker';
import { AuthService } from './auth.service';
import { LocalNotification, LocalNotificationsService } from './local-notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCurrencyPipe } from '../../shared/pipes/menu-currency.pipe';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class TodayOrdersService {
  private _orders = new BehaviorSubject<Order[] | undefined>(undefined);
  private lastUpdate: Date;

  onNewOrder = new EventEmitter<void>();
  onUpdateOrder = new EventEmitter<void>();

  constructor(
    private ordersService: OrdersService,
    private swPush: SwPush,
    private auth: AuthService,
    private localNotificationsService: LocalNotificationsService,
    private translate: TranslateService,
    private menuCurrencyPipe: MenuCurrencyPipe,
    private router: Router
  ) {
    this.loadData();
    setInterval(() => {
      this.loadData();
    }, 10000);

    this.swPush.messages.subscribe((message: any) => {
      try {
        if (message.notification.data.newOrder) this.loadData();
      } catch (error) {}
    });

    // this.newOrders.subscribe((orders) => {
    //   for (const order of orders) {
    //     this.notifOrder(order);
    //   }
    // });
  }

  notifOrder(order: Order) {
    if (order.state !== OrderState.Pending) return;
    let title: string;
    switch (order.type) {
      case OrderType.Delivery:
        title = this.translate.instant('orderType.delivery');
        break;
      case OrderType.DineIn:
        title = this.translate.instant('orderType.dineIn', {
          value: order.details.table || '-',
        });
        break;
      case OrderType.Takeaway:
        title = this.translate.instant('orderType.takeaway');
        break;
    }
    const itemsText = order.items
      .filter((x) => !x.isAbstract)
      .map((x) => `${x.title}(${x.quantity})`)
      .join(' - ');

    const notif = this.localNotificationsService.add({
      id: order.id,
      createdAt: order.createdAt,
      title,
      contents: [
        itemsText,
        `${this.menuCurrencyPipe.transform(order.totalPrice)} ${
          order.paymentType ? this.translate.instant('newOrderNotification.payed') : ''
        }`,
      ],
      actions: [
        { icon: 'fas fa-check-circle', tooltip: this.translate.instant('app.ok'), color: 'primary' },
        {
          icon: 'fas fa-print',
          tooltip: this.translate.instant('newOrderNotification.print'),
          color: 'primary',
        },
        { icon: 'fas fa-eye', tooltip: this.translate.instant('newOrderNotification.view') },
      ],
      soundIndex: 1,
      lifetime: 300000,
    } as LocalNotification);

    notif?.onAction?.subscribe(async (action) => {
      switch (action) {
        case 0:
        case 1:
          notif.disabled = true;
          await this.ordersService.changeState(order, OrderState.Processing);
          notif.close();
          break;
        case 2:
          this.router.navigate(['/orders/details', order.id]);
          notif.close();
          break;
      }
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
      let newOrders: Order[] = [];
      for (const ord of orders) {
        const existOrd = this.orders.find((x) => x.id === ord.id);
        if (existOrd) {
          Object.assign(existOrd, ord);
        } else {
          newOrders.push(ord);
          this.notifOrder(ord);
        }
      }
      if (orders.length) {
        if (newOrders.length) {
          this._orders.next([...newOrders, ...this.orders]);
          this.onNewOrder.emit();
        } else this.onUpdateOrder.emit();
      }
    }
  }

  getById(id: string): Order | undefined {
    try {
      return this._orders.value?.find((x) => x.id === id);
    } catch (error) {}
    return;
  }

  get newOrders() {
    return this._orders.pipe(map((x) => x?.filter((y) => y.state === OrderState.Pending) || []));
  }
}

import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrderDialogComponent } from '../../shared/dialogs/order-dialog/order-dialog.component';
import { MenuCurrencyPipe } from '../../shared/pipes/menu-currency.pipe';
import { Order } from '@menno/types';
import { OrderState } from '@menno/types';
import { OrderType } from '@menno/types';
import { LocalNotificationsService } from './local-notifications.service';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root',
})
export class TodayOrdersService {
  _orders: BehaviorSubject<Order[]> = new BehaviorSubject([]);

  constructor(
    private orderService: OrderService,
    private dialog: MatDialog,
    private router: Router,
    private menuCurrencyPipe: MenuCurrencyPipe,
    private translate: TranslateService,
    private localNotificationsService: LocalNotificationsService,
    private swPush: SwPush
  ) {
    this.loadTodayOrders();
    setInterval(() => {
      this.loadTodayOrders();
    }, 6000);

    this.swPush.messages.subscribe((message: any) => {
      try {
        if (message.notification.data.newOrder) this.loadTodayOrders();
      } catch (error) { }
    });
  }

  get orders(): Observable<Order[]> {
    return new Observable((fn) => this._orders.subscribe(fn));
  }

  async loadTodayOrders() {
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 99);
    try {
      const orders = await this.orderService.filter({ fromDate, toDate, withDeleted: true, });

      for (const order of orders) {
        const existOrder = this._orders.value.find((x) => x.id === order.id);
        if (!existOrder && order.state === OrderState.Pending) {
          let title: string;
          switch (order.type) {
            case OrderType.Delivery:
              title = this.translate.instant('newOrderNotification.titleDelivery');
              break;
            case OrderType.DineIn:
              title = this.translate.instant('newOrderNotification.titleDineIn', { value: order.details.table || '-' });
              break;
            case OrderType.Takeaway:
              title = this.translate.instant('newOrderNotification.titleTakeaway');
              break;
          }
          const itemsText = order.items.filter(x => !x.isAbstract).map(x => `${x.title}(${x.quantity})`).join(' - ');
          const notif = this.localNotificationsService.add({
            createdAt: order.createdAt,
            title, contents: [
              itemsText,
              `${this.menuCurrencyPipe.transform(order.totalPrice)} ${order.isPayed ?
                this.translate.instant('newOrderNotification.payed') : ''
              }`
            ],
            actions: [
              { icon: 'fas fa-check-circle', tooltip: this.translate.instant('app.ok'), color: 'primary' },
              { icon: 'fas fa-print', tooltip: this.translate.instant('newOrderNotification.print'), color: 'primary' },
              { icon: 'fas fa-eye', tooltip: this.translate.instant('newOrderNotification.view') },
            ],
            soundIndex: 1,
            lifetime: 300000,
          });

          notif.onAction.subscribe(async (action) => {
            switch (action) {
              case 0:
              case 1:
                notif.disabled = true;
                await this.orderService.changeState(order, OrderState.Processing);
                notif.close();
                break;
              case 2:
                this.router.navigate(['/orders', order.id]);
                notif.close();
                break;
            }
          });
        }
      }

      this._orders.next(orders);
    } catch (error) { }
  }

  getById(id: string): Order {
    try {
      return this._orders.value.find(x => x.id === id);
    } catch (error) { }
  }
}

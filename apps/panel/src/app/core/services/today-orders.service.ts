import { EventEmitter, Injectable, signal } from '@angular/core';
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
  private lastUpdate = signal<Date | null>(null);

  constructor(
    private ordersService: OrdersService,
    private swPush: SwPush,
    private auth: AuthService,
    private localNotificationsService: LocalNotificationsService,
    private translate: TranslateService,
    private menuCurrencyPipe: MenuCurrencyPipe,
    private router: Router,
  ) {
    // this.loadData();
    // setInterval(() => {
    //   this.loadData();
    // }, 10000);

    this.swPush.messages.subscribe((message: any) => {
      try {
        if (message.notification.data.newOrder) {
          this.ordersService.updateQuery(message.notification.data.newOrder, true);
          this.notifOrder(message.notification.data.newOrder);
        }
      } catch (error) {}
    });
  }

  notifOrder(order: Order) {
    if (order.state !== OrderState.Pending || order.mergeFrom?.length) return;
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
}

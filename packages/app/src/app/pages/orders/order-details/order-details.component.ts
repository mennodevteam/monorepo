import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order, OrderState, Shop } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent {
  order: Order | undefined;
  OrderState = OrderState;
  interval: any;
  paying = false;

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrdersService,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    this.route.params.subscribe((params) => {
      this.order = undefined;
      this.loadOrder(params['id']);
    });

    this.interval = setInterval(() => {
      if (this.order) {
        const diffInHour = (Date.now() - new Date(this.order.createdAt).valueOf()) / 3600000;
        if (diffInHour < 3) this.loadOrder(this.order.id);
      }
    }, 10000);
  }

  loadOrder(id: string) {
    const order = this.ordersService.getById(id).subscribe((order) => {
      if (order) this.order = order;
    });
  }

  get shop() {
    return this.order?.shop;
  }

  get state() {
    return this.order?.state;
  }

  get items() {
    return this.order?.items || [];
  }

  pay() {
    if (!this.shop || !this.order || !this.isPaymentAvailable) return;
    if (this.order?.state === OrderState.Pending) {
      this.snack.open(this.translate.instant('orderDetails.paymentAfterAccept'));
      return;
    }
    this.paying = true;
    try {
      this.ordersService.payOrder(this.order.id);
    } catch (error) {
      this.paying = false;
    }
  }

  get isPaymentAvailable() {
    if (this.shop) return Shop.isPaymentAvailable(this.shop);
    return false;
  }
}

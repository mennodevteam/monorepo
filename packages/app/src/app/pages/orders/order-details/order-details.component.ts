import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order, OrderState } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent {
  order: Order | undefined;
  OrderState = OrderState;

  constructor(private route: ActivatedRoute, private ordersService: OrdersService) {
    this.route.params.subscribe((params) => {
      this.order = undefined;
      this.loadOrder(params['id']);
    });
  }

  get showStateCard() {
    if (this.order?.state != undefined) {
      return [
        OrderState.Canceled,
        OrderState.Pending,
        OrderState.Shipping,
        OrderState.Processing,
        OrderState.Ready,
      ].includes(this.order.state);
    }
    return false;
  }

  loadOrder(id: string) {
    const order = 
    this.ordersService.getById(id).subscribe((order) => {
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
}

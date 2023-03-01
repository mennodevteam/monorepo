import { Component } from '@angular/core';
import { Order } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent {
  orders = new BehaviorSubject<Order[]>([]);
  constructor(private ordersService: OrdersService) {
    this.ordersService.getOrders(new Date()).then((orders) => {
      if (orders) {
        this.orders.next(orders);
      }
    });
  }
}

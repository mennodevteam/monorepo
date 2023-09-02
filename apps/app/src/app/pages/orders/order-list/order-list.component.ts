import { Component } from '@angular/core';
import { Order } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
})
export class OrderListComponent {
  orders: Order[];

  constructor(private ordersService: OrdersService) {
    this.ordersService.list().subscribe((orders) => {
      if (orders) {
        this.orders = orders;
      }
    });
  }
}

import { AfterViewInit, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Order, OrderState, OrderType, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'orders-table',
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.scss'],
})
export class OrdersTableComponent implements AfterViewInit {
  User = User;
  OrderType = OrderType;
  OrderState = OrderState;
  dataSource = new MatTableDataSource<Order>();

  @Input() pageSizeOptions: number[];
  @Input() columns = ['qNumber', 'customer', 'type', 'total', 'state', 'date', 'actions'];
  @Input() orders: BehaviorSubject<Order[]>;

  constructor(private dialog: MatDialog, private ordersService: OrdersService) {}

  ngAfterViewInit() {
    this.orders.subscribe((orders) => {
      this.dataSource = new MatTableDataSource(orders);
    });
  }

  changeState(order: Order) {
    let newState: OrderState | undefined;
    switch (order.state) {
      case OrderState.Pending:
        newState = OrderState.Processing;
        break;
      case OrderState.Processing:
        newState = order.type === OrderType.Delivery ? OrderState.Shipping : OrderState.Completed;
        break;
      case OrderState.Shipping:
      case OrderState.Ready:
        newState = OrderState.Completed;
        break;
    }

    if (newState != undefined) {
      this.ordersService.changeState(order, newState);
    }
  }
}

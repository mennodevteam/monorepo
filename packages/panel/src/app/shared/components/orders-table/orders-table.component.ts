import { AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Member, Order, OrderState, OrderType, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ClubService } from '../../../core/services/club.service';
import { OrdersService } from '../../../core/services/orders.service';
import { MemberSelectDialogComponent } from '../../dialogs/member-select-dialog/member-select-dialog.component';
import { SettlementDialogComponent } from '../../dialogs/settlement-dialog/settlement-dialog.component';

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
  @Output() orderClicked = new EventEmitter<Order>();

  constructor(private dialog: MatDialog, private ordersService: OrdersService, private club: ClubService) {}

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

  async openSelectMember(order: Order) {
    if (order.deletedAt || order.state == OrderState.Canceled) return;
    let member: Member = await this.dialog.open(MemberSelectDialogComponent).afterClosed().toPromise();
    if (member) {
      await this.ordersService.setCustomer(order, member.id);
    }
  }

  settlement(order: Order) {
    this.dialog.open(SettlementDialogComponent, {
      data: {
        order,
      },
    });
  }
}

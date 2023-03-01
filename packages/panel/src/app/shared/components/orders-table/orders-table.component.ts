import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Order, OrderPaymentType, OrderState, OrderType, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../../core/services/orders.service';
import { AlertDialogComponent } from '../../dialogs/alert-dialog/alert-dialog.component';

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
  @Input() columns = [
    'qNumber',
    'customer',
    'type',
    'total',
    'state',
    'waiter',
    'date',
    'actions',
  ];
  @Input() orders: BehaviorSubject<Order[]>;
  
  ngAfterViewInit() {
    this.orders.subscribe((orders) => {
      this.dataSource = new MatTableDataSource(orders)
    })
  }
}

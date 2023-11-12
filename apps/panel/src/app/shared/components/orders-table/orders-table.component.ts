import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Member, Order, OrderPaymentType, OrderState, OrderType, ShopPrintView, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ClubService } from '../../../core/services/club.service';
import { OrdersService } from '../../../core/services/orders.service';
import { PrinterService } from '../../../core/services/printer.service';
import { MemberSelectDialogComponent } from '../../dialogs/member-select-dialog/member-select-dialog.component';
import { SettlementDialogComponent } from '../../dialogs/settlement-dialog/settlement-dialog.component';
import { PromptDialogComponent } from '../../dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MemberDialogComponent } from '../../dialogs/member-dialog/member-dialog.component';

@Component({
  selector: 'orders-table',
  templateUrl: './orders-table.component.html',
  styleUrls: ['./orders-table.component.scss'],
})
export class OrdersTableComponent implements AfterViewInit {
  User = User;
  OrderType = OrderType;
  OrderState = OrderState;
  OrderPaymentType = OrderPaymentType;
  dataSource = new MatTableDataSource<Order>();

  @Input() showCheckbox = false;
  @Input() pageSizeOptions: number[];
  @Input() columns = ['qNumber', 'customer', 'type', 'total', 'state', 'waiter', 'date', 'actions'];
  @Input() orders: BehaviorSubject<Order[]>;
  @Output() orderClicked = new EventEmitter<Order>();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private printService: PrinterService,
    private translate: TranslateService
  ) {}

  ngAfterViewInit() {
    if (this.orders.value) {
      this.dataSource = new MatTableDataSource(this.orders.value);
      this.cdr.detectChanges();
    }
    this.orders.subscribe((orders) => {
      this.dataSource = new MatTableDataSource(orders);
    });
  }

  changeState(order: Order) {
    let newState = Order.nextState(order);
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

  print(order: Order, view?: ShopPrintView) {
    this.printService.printOrder(order.id, view);
  }

  memberInfo(order: Order) {
    if (order.customer?.mobilePhone) {
      this.dialog.open(MemberDialogComponent, {
        data: { mobilePhone: order.customer?.mobilePhone },
      });
    }
  }

  remove(order: Order) {
    this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('deleteOrderDialog.title'),
          description: this.translate.instant('deleteOrderDialog.description'),
          label: this.translate.instant('deleteOrderDialog.label'),
          type: 'textarea',
        },
        disableClose: true,
      })
      .afterClosed()
      .subscribe((reason) => {
        if (reason !== null) {
          this.ordersService.remove(order, reason);
        }
      });
  }
}

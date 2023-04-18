import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { Member, Order, OrderState, OrderType, ShopPrintView, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../../core/services/orders.service';
import { TodayOrdersService } from '../../../core/services/today-orders.service';
import { MemberSelectDialogComponent } from '../../../shared/dialogs/member-select-dialog/member-select-dialog.component';
import { SettlementDialogComponent } from '../../../shared/dialogs/settlement-dialog/settlement-dialog.component';
import { PrinterService } from '../../../core/services/printer.service';

@Component({
  selector: 'order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent {
  order: Order | undefined;
  User = User;
  displayedColumns = ['row', 'title', 'price', 'quantity', 'sum'];
  OrderType = OrderType;
  OrderState = OrderState;
  @ViewChild('stepper') stepper: MatStepper;
  form = new FormGroup({});

  constructor(
    private route: ActivatedRoute,
    private orderService: OrdersService,
    private dialog: MatDialog,
    private todayOrders: TodayOrdersService,
    private printService: PrinterService
  ) {
    this.loadOrder();
  }

  async loadOrder() {
    const order = this.todayOrders.getById(this.orderId) || (await this.orderService.getById(this.orderId));
    this.order = order;
  }

  get orderId() {
    return this.route.snapshot.params['id'];
  }

  changeState(state: OrderState) {
    if (this.order) this.orderService.changeState(this.order, state);
  }

  get states() {
    switch (this.order?.type) {
      case OrderType.Delivery:
        return [OrderState.Pending, OrderState.Processing, OrderState.Shipping, OrderState.Completed];
      case OrderType.DineIn:
        return [OrderState.Pending, OrderState.Processing, OrderState.Ready, OrderState.Completed];
      case OrderType.Takeaway:
        return [OrderState.Pending, OrderState.Processing, OrderState.Completed];
    }
    return [];
  }

  get selectedIndex() {
    if (this.order) {
      return this.states.indexOf(this.order.state);
    }
    return 0;
  }

  get sum() {
    if (this.order) return Order.sum(this.order);
    return;
  }

  get total() {
    if (this.order) return Order.total(this.order);
    return;
  }

  get productItems() {
    if (this.order) return Order.productItems(this.order);
    return [];
  }

  get abstractItems() {
    if (this.order) return Order.abstractItems(this.order);
    return [];
  }

  async nextState() {
    if (this.order) {
      const selectedIndex = this.states.indexOf(this.order?.state);
      if (selectedIndex < this.states.length - 1) {
        await this.orderService.changeState(this.order, this.states[selectedIndex + 1]);
        // this.stepper.selectedIndex = this.selectedIndex;
      }
    }
  }

  settlement(order: Order) {
    this.dialog.open(SettlementDialogComponent, {
      data: {
        order,
      },
    });
  }

  async openSelectMember() {
    if (!this.order || this.order.deletedAt || this.order.state == OrderState.Canceled) return;
    let member: Member = await this.dialog.open(MemberSelectDialogComponent).afterClosed().toPromise();
    if (member) {
      await this.orderService.setCustomer(this.order, member.id);
    }
  }

  get printers() {
    return this.printService.printers;
  }

  print(view?: ShopPrintView) {
    if (this.order) this.printService.printOrder(this.order.id, view);
  }

  removeOrder() {}
}

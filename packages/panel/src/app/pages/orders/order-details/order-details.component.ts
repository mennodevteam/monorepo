import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import {
  Member,
  Order,
  OrderDetails,
  OrderState,
  OrderType,
  ShopPrintView,
  ThirdPartyApp,
  User,
} from '@menno/types';
import { BehaviorSubject, map } from 'rxjs';
import { OrdersService } from '../../../core/services/orders.service';
import { TodayOrdersService } from '../../../core/services/today-orders.service';
import { MemberSelectDialogComponent } from '../../../shared/dialogs/member-select-dialog/member-select-dialog.component';
import { SettlementDialogComponent } from '../../../shared/dialogs/settlement-dialog/settlement-dialog.component';
import { PrinterService } from '../../../core/services/printer.service';
import { AlopeykService, DeliveryOrder } from '../../../core/services/alopeyk.service';
import { AlertDialogComponent } from '../../../shared/dialogs/alert-dialog/alert-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopService } from '../../../core/services/shop.service';
import { PromptDialogComponent } from '../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { MemberDialogComponent } from '../../../shared/dialogs/member-dialog/member-dialog.component';

@Component({
  selector: 'order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnDestroy {
  order: Order | undefined;
  User = User;
  displayedColumns = ['row', 'title', 'price', 'quantity', 'sum'];
  OrderType = OrderType;
  OrderState = OrderState;
  form = new FormGroup({});
  deliveryOrder?: DeliveryOrder;
  interval: any;
  loading = {
    alopeykDeliveryPrice: false,
    sendingLinkToCustomer: false,
    sendingLinkToPayk: false,
  };

  constructor(
    private route: ActivatedRoute,
    public orderService: OrdersService,
    private dialog: MatDialog,
    private todayOrders: TodayOrdersService,
    private printService: PrinterService,
    private alopeyk: AlopeykService,
    private translate: TranslateService,
    private snack: MatSnackBar,
    private decimalPipe: DecimalPipe,
    private shopService: ShopService
  ) {
    this.route.params.subscribe((params) => {
      this.order = this.todayOrders.getById(this.orderId);
      this.loadOrder();
      if (this.interval) clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.loadOrder();
      }, 10000);
    });
  }

  async loadOrder() {
    const order = await this.orderService.getById(this.orderId);
    this.order = order;
    this.loadDeliveryOrder();
  }

  async loadDeliveryOrder() {
    if (this.order?.details?.deliveryId) {
      const res = await this.alopeyk.getOrderDetails(Number(this.order.details.deliveryId));
      if (res && ['expired', 'cancelled'].indexOf(res.status) > -1) {
        this.orderService.setDetails(this.order!, { deliveryId: null });
        this.order.details.deliveryId = undefined;
      } else {
        this.deliveryOrder = res;
      }
    }
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

  get nextState() {
    if (this.order) {
      const selectedIndex = this.states.indexOf(this.order?.state);
      if (selectedIndex < this.states.length - 1) {
        return this.states[selectedIndex + 1];
      }
    }
    return;
  }

  async goNextState() {
    const nextState = this.nextState;
    if (nextState !== undefined && this.order) {
      await this.orderService.changeState(this.order, nextState);
    }
  }

  memberInfo() {
    if (this.order?.customer?.mobilePhone) {
      this.dialog.open(MemberDialogComponent, {
        data: { mobilePhone: this.order?.customer?.mobilePhone },
      });
    }
  }

  settlement(order: Order) {
    this.dialog.open(SettlementDialogComponent, {
      data: {
        order,
      },
    });
  }

  async setEstimate() {
    const val = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('orderDetails.estimateTime'),
          description: this.translate.instant('orderDetails.estimateTimeDialogDescription'),
          type: 'number',
        },
      })
      .afterClosed()
      .toPromise();

    if (val && this.order) {
      const estimateDate = new Date();
      estimateDate.setMinutes(estimateDate.getMinutes() + Number(val));
      const details: OrderDetails = { ...this.order?.details, ...{ estimateCompletedAt: estimateDate } };
      this.orderService.setDetails(this.order, details);
    }
  }

  async sendLinkToPeyk() {
    const val = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('orderDetails.sendLinkToPeyk'),
          description: this.translate.instant('orderDetails.sendLinkToPeykDialogDescription'),
        },
      })
      .afterClosed()
      .toPromise();

    if (val && this.order) {
      this.orderService.sendLinkToPayk(this.order.id, val);
    }
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

  removeOrder() {
    if (!this.order) return;
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
          this.orderService.remove(this.order!, reason);
        }
      });
  }

  alopeykLoadOrders() {
    this.alopeyk.loadOrders();
  }

  get alopeykOrders() {
    return this.alopeyk.orders.pipe(
      map((x) =>
        x.filter(
          (y) =>
            ['expired', 'cancelled'].indexOf(y.status) === -1 && Date.now() - y.createdAt.valueOf() < 3600000
        )
      )
    );
  }

  async addAlopeyk() {
    if (this.order && this.order?.type === OrderType.Delivery && this.order.address) {
      const dest: [number, number] = [this.order.address.latitude, this.order.address.longitude];
      this.loading.alopeykDeliveryPrice = true;
      const price = await this.alopeyk.calcPrice(dest);
      this.loading.alopeykDeliveryPrice = false;
      this.dialog
        .open(AlertDialogComponent, {
          data: {
            title: this.translate.instant('alopeyk.requestPeyk'),
            description: this.translate.instant('alopeyk.priceDialogDescription', {
              value: this.decimalPipe.transform(price),
            }),
          },
        })
        .afterClosed()
        .subscribe((accept) => {
          if (accept) {
            this.alopeyk.addOrder(dest, this.order).then((res) => {
              if (res) {
                this.snack.open(this.translate.instant('alopeyk.requestPeykSuccess'), '', {
                  panelClass: 'success',
                });
                this.deliveryOrder = res;
                this.orderService.setDetails(this.order!, { deliveryId: res.id.toString() });
              }
            });
          }
        });
    }
  }

  async cancelAlopeyk() {
    if (this.order && this.order?.details.deliveryId) {
      await this.alopeyk.cancelOrder(Number(this.order.details.deliveryId));
      this.order.details.deliveryId = undefined;
      this.deliveryOrder = undefined;
    }
  }

  get hasAlopeyk() {
    return this.shopService.shop?.thirdParties?.find((x) => x.app === ThirdPartyApp.Alopeyk);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}

import { DecimalPipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MANUAL_COST_TITLE,
  MANUAL_DISCOUNT_TITLE,
  Member,
  Order,
  OrderItem,
  OrderPaymentType,
} from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../../../core/services/orders.service';
import { ShopService } from '../../../core/services/shop.service';
import { ManualDiscountAndCostDialogComponent } from '../manual-discount-and-cost-dialog/manual-discount-and-cost-dialog.component';
import { ClubService } from '../../../core/services/club.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MenuCurrencyPipe } from '../../pipes/menu-currency.pipe';

@Component({
  selector: 'app-settlement-dialog',
  templateUrl: './settlement-dialog.component.html',
  styleUrls: ['./settlement-dialog.component.scss'],
})
export class SettlementDialogComponent implements OnInit {
  order: Order;
  orderItems: OrderItem[];
  manualDiscount = new OrderItem();
  manualCost = new OrderItem();
  mod1000: number;
  mod5000: number;
  mod10000: number;
  posList: string[];
  posValues: number[];
  member: Member;
  useWallet: boolean;
  MANUAL_COST_TITLE = MANUAL_COST_TITLE;
  MANUAL_DISCOUNT_TITLE = MANUAL_DISCOUNT_TITLE;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
    private dialog: MatDialog,
    private translate: TranslateService,
    private menuCurrency: MenuCurrencyPipe,
    private shopService: ShopService,
    private snack: MatSnackBar,
    private club: ClubService,
    private orderService: OrdersService
  ) {
    this.order = data.order;
    this.orderItems = [...this.order.items];
    const existManualDiscountItem = this.orderItems.find(
      (x) => x.isAbstract && x.title === MANUAL_DISCOUNT_TITLE
    );
    if (existManualDiscountItem) {
      this.manualDiscount = existManualDiscountItem;
    } else {
      this.manualDiscount.price = 0;
      this.manualDiscount.quantity = 1;
      this.manualDiscount.title = MANUAL_DISCOUNT_TITLE;
      this.manualDiscount.isAbstract = true;
      this.orderItems.push(this.manualDiscount);
    }

    const existManualCostItem = this.orderItems.find((x) => x.isAbstract && x.title === MANUAL_COST_TITLE);
    if (existManualCostItem) {
      this.manualCost = existManualCostItem;
    } else {
      this.manualCost.price = 0;
      this.manualCost.quantity = 1;
      this.manualCost.title = MANUAL_COST_TITLE;
      this.manualCost.isAbstract = true;
      this.orderItems.push(this.manualCost);
    }

    this.mod1000 = (this.order.totalPrice - this.manualDiscount.price - this.manualCost.price) % 1000;
    this.mod5000 = (this.order.totalPrice - this.manualDiscount.price - this.manualCost.price) % 5000;
    this.mod10000 = (this.order.totalPrice - this.manualDiscount.price - this.manualCost.price) % 10000;

    this.posList = this.shopService.shop!.details.poses || [this.translate.instant('settlementDialog.pos')];
    this.posValues = this.posList.map((x) => 0);
    this.posValues[0] = this.totalPrice;

    if (this.order.customer) {
      this.club.getMemberByUserId(this.order.customer.id).then((member) => {
        if (member) this.member = member;
      });
    }
  }

  ngOnInit(): void {}

  resetPosValues() {
    const selectedPosValue = this.posValues.filter((x) => x > 0);
    if (selectedPosValue.length === 1) {
      this.clickCashType(this.posValues.findIndex((x) => x > 0));
    } else if (selectedPosValue.length > 1) {
      this.clickCashType(0);
    }
  }

  get cashValue(): number {
    let sum = 0;
    for (const v of this.posValues) {
      sum += v;
    }
    return this.totalPrice - sum;
  }

  get abstractItems(): OrderItem[] {
    try {
      return this.orderItems.filter((x) => x.isAbstract);
    } catch (error) {
      return [];
    }
  }

  get items(): OrderItem[] {
    try {
      return this.orderItems.filter((x) => !x.isAbstract);
    } catch (error) {
      return [];
    }
  }

  get sum(): number {
    const items = this.items;
    let sum = 0;
    try {
      for (const item of items) {
        sum += item.quantity * item.price;
      }
    } catch (error) {}
    return sum;
  }

  get totalPrice(): number {
    let total = 0;
    try {
      for (const item of this.orderItems) {
        total += item.quantity * item.price;
      }
    } catch (error) {}
    return Math.max(total, 0);
  }

  removeManualCost() {
    this.manualCost.price = 0;
    this.resetPosValues();
  }

  removeManualDiscount() {
    this.manualDiscount.price = 0;
    this.resetPosValues();
  }

  clickCashType(posIndex?: number) {
    const selectedPosValue = this.posValues.filter((x) => x > 0);
    if (posIndex === undefined || this.posValues[posIndex] > 0 || this.cashValue === 0) {
      for (let i = 0; i < this.posValues.length; i++) {
        if (i === posIndex) this.posValues[i] = this.totalPrice;
        else this.posValues[i] = 0;
      }
    } else {
      this.posValues[posIndex] = this.cashValue;
    }
  }

  async save() {
    // check sum of pos values
    let sumPosValues = 0;
    for (const v of this.posValues) {
      sumPosValues += v;
    }
    if (sumPosValues > this.totalPrice) {
      this.snack.open(this.translate.instant('settlementDialog.posError'), '', { panelClass: 'warning' });
      return;
    }

    const paymentType = this.useWallet ? OrderPaymentType.ClubWallet : OrderPaymentType.Cash;
    
    if (
      paymentType === OrderPaymentType.ClubWallet &&
      this.member.wallet &&
      this.member.wallet.charge < this.totalPrice
      ) {
        const ok = await this.dialog.open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('settlementDialog.chargeAlertDialog.title'),
          description: this.translate.instant('settlementDialog.chargeAlertDialog.description', {
            value: this.menuCurrency.transform(this.totalPrice - this.member.wallet.charge),
          }),
        },
      }).afterClosed().toPromise();
      if (!ok) return;
    }
    try {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
      await this.orderService.settlement(this.order, {
        orderId: this.order.id,
        manualDiscount: this.manualDiscount.price,
        manualCost: this.manualCost.price,
        posPayed: this.useWallet ? undefined : this.posValues,
        type: paymentType,
      });
      this.dialogRef.close(true);
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
    } catch (error) {
      this.snack.open(this.translate.instant('settlementDialog.minChargeError'), '', {
        panelClass: 'warning',
      });
    }
  }

  openDiscountAndCostDialog(item: OrderItem) {
    this.dialog
      .open(ManualDiscountAndCostDialogComponent, {
        data: {
          totalPrice: this.order.totalPrice - this.manualDiscount.price - this.manualCost.price,
          sum: this.sum,
          price: item.price,
        },
      })
      .afterClosed()
      .subscribe((val) => {
        if (val != undefined) {
          if (item.title === MANUAL_DISCOUNT_TITLE) val = -val;
          item.price = val;
          this.resetPosValues();
        }
      });
  }
}

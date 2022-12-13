import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FilterOrderDto } from '@menno/types';
import { ManualSettlementDto } from '@menno/types';
import { Order } from '@menno/types';
import { OrderState } from '@menno/types';
import { OrderDto } from '@menno/types';
import { ShopService } from './shop.service';
import { PromptDialogComponent } from '@shared/dialogs/prompt-dialog/prompt-dialog.component';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private http: HttpClient,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService,
    private shopService: ShopService,
    private decimalPipe: DecimalPipe,
    private menuService: MenuService,
  ) {
  }

  insert(order: OrderDto): Promise<Order> {
    return this.http.post<Order>('orders', order).toPromise();
  }

  editItems(order: OrderDto): Promise<Order> {
    return this.http.put<Order>('orders/items', order).toPromise();
  }

  filter(dto: FilterOrderDto): Promise<Order[]> {
    return this.http.post<Order[]>('orders/filter', dto).toPromise();
  }

  getById(id: string): Promise<Order> {
    return this.http.get<Order>('orders/' + id).toPromise();
  }

  async changeState(order: Order, state: OrderState): Promise<Order> {
    try {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
      const savedOrder = await this.http.get<Order>(`orders/changeState/${order.id}/${state}`).toPromise();
      order.state = state;
      this.snack.open(this.translate.instant('app.changedSuccessfully'), '', { panelClass: 'success' });
      return savedOrder;
    } catch (error) {
      this.snack.open(this.translate.instant('app.savedError'), '', { panelClass: 'error' });
      throw new Error(error);
    }
  }

  async setCustomer(order: Order, customerId: string): Promise<Order> {
    try {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
      const savedOrder = await this.http.get<Order>(`orders/setCustomer/${order.id}/${customerId}`).toPromise();
      order.customer = savedOrder.customer;
      this.snack.open(this.translate.instant('app.changedSuccessfully'), '', { panelClass: 'success' });
      return order;
    } catch (error) {
      this.snack.open(this.translate.instant('app.savedError'), '', { panelClass: 'error' });
      throw new Error(error);
    }
  }

  print(orderId: string, printViewId?: string) {
    this.http.get(`printer/print-order/${orderId}/${printViewId}`).toPromise();
  }

  async remove(order: Order) {
    const val = await this.dialog.open(PromptDialogComponent, {
      data: {
        title: this.translate.instant('orderDetails.deleteDialogTitle', {value: order.qNumber}),
        description: this.translate.instant('orderDetails.deleteDialogDescription'),
        label: this.translate.instant('orderDetails.deleteDialogLabel'),
        hint: this.translate.instant('orderDetails.deleteDialogHint'),
      }
    }).afterClosed().toPromise();
    if (val !== null) {
      await this.http.delete(`orders/${order.id}`, {
        body: {
          deletionReason: val,
        }
      }).toPromise();
      order.deletedAt = new Date();
      order.details.deletionReason = val;
      order.state = OrderState.Canceled;
      this.menuService.loadStockItems();
    }
  }

  sendLinkToCustomer(orderId: string) {
    return this.http.get(`orders/sendLinkToCustomer/${orderId}`).toPromise();
  }

  async update(order: Order): Promise<Order> {
    return this.http.put<Order>(`orders`, order).toPromise();
  }

  makeGroup(orderIds: string[]): Promise<Order> {
    return this.http.post<Order>('orders/group', orderIds).toPromise();
  }

  unGroup(orderId: string): Promise<any> {
    return this.http.get(`orders/unGroup/${orderId}`).toPromise();
  }

  async settlement(dto: ManualSettlementDto): Promise<Order> {
    return this.http.post<Order>(`orders/settlement`, dto).toPromise();
  }

  getPaymentText(order: Order): string {
    if (order.details.paymentType === 'online') {
      return this.translate.instant('orderDetails.online');
    } else if (order.details.paymentType === 'clubWallet') {
      return this.translate.instant('orderDetails.clubWallet');
    } else {
      const poses = this.shopService.instant.details.poses || [];
      let res: string[] = [];
      let sumPos = 0;
      if (order.details.posPayed) {
        for (let i = 0; i < order.details.posPayed.length; i++) {
          if (order.details.posPayed[i]) {
            res.push(`${poses[i] || this.translate.instant('app.pos')}: ${this.decimalPipe.transform(order.details.posPayed[i])}`);
            sumPos += order.details.posPayed[i];
          }
        }
      }

      if (sumPos < order.totalPrice) {
        res.push(`${this.translate.instant('app.cash')}: ${this.decimalPipe.transform(order.totalPrice - sumPos)}`);
      }

      return res.join(' - ');
    }
  }

  async setEstimateCompletedAt(order: Order) {
    let prevVal: number;
    if (order.details.estimateCompletedAt) {
      const now = new Date();
      const estimate = new Date(order.details.estimateCompletedAt);
      const diff = estimate.valueOf() - now.valueOf();
      if (diff > 0) prevVal = Math.floor(diff / 1000 / 60);
    }
    const val = await this.dialog.open(PromptDialogComponent, {
      data: {
        title: this.translate.instant('estimateCompletedAtDialog.title'),
        description: this.translate.instant('estimateCompletedAtDialog.description'),
        label: this.translate.instant('estimateCompletedAtDialog.label'),
        hint: this.translate.instant('estimateCompletedAtDialog.hint'),
        type: 'number',
        value: prevVal,
      }
    }).afterClosed().toPromise();

    if (val) {
      const estimate = new Date();
      estimate.setMinutes(estimate.getMinutes() + Number(val));
      order.details.estimateCompletedAt = estimate;
      return this.update(<Order>{
        id: order.id,
        details: order.details,
      });
    }
  }
}

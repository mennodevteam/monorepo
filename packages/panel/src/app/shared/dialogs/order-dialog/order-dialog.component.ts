import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Order } from '@menno/types';
import { OrderState } from '@menno/types';
import { OrderType } from '@menno/types';
import { User } from '@menno/types';
import { OrderService } from '../../../core/services/order.service';
import { ProgressDialogComponent } from '../progress-dialog/progress-dialog.component';

@Component({
  selector: 'app-order-dialog',
  templateUrl: './order-dialog.component.html',
  styleUrls: ['./order-dialog.component.scss']
})
export class OrderDialogComponent implements OnInit {
  order: Order;
  User = User;
  OrderType = OrderType;
  OrderState = OrderState;
  settlementing = false;
  displayedColumns = ['row', 'title', 'price', 'quantity', 'sum'];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>,
    private orderService: OrderService,
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {
    this.order = this.data.order;
  }

  ngOnInit(): void {
  }

  async settlement() {
    this.settlementing = true;
    await this.orderService.update(<Order>{id: this.order.id, isPayed: true});
    this.settlementing = false;
    this.order.isPayed = true;
  }

  async accept() {
    const loadingDialog = this.dialog.open(ProgressDialogComponent, {
      data: {
        description: this.translate.instant('app.saving'),
      },
      disableClose: true,
    });
    this.orderService.changeState(this.order, OrderState.Processing);
    this.dialogRef.close();
    loadingDialog.close();
  }
}

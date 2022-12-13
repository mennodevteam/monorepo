import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderType } from '@menno/types';

@Component({
  selector: 'app-order-types-dialog',
  templateUrl: './order-types-dialog.component.html',
  styleUrls: ['./order-types-dialog.component.scss']
})
export class OrderTypesDialogComponent implements OnInit {
  dineIn: boolean;
  delivery: boolean;
  takeaway: boolean;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>,
  ) {
    const orderTypes: OrderType[] = this.data.orderTypes;
    try {
      this.dineIn = orderTypes.indexOf(OrderType.DineIn) > -1;
      this.delivery = orderTypes.indexOf(OrderType.Delivery) > -1;
      this.takeaway = orderTypes.indexOf(OrderType.Takeaway) > -1;
    } catch (error) {
      
    }
  }

  ngOnInit(): void {
  }

  save() {
    const types: OrderType[] = [];
    if (this.dineIn) types.push(OrderType.DineIn);
    if (this.delivery) types.push(OrderType.Delivery);
    if (this.takeaway) types.push(OrderType.Takeaway);
    this.dialogRef.close(types);
  }
}

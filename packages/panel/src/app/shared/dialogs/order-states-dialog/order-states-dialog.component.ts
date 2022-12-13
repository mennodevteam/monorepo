import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderState } from '@menno/types'

@Component({
  selector: 'app-order-states-dialog',
  templateUrl: './order-states-dialog.component.html',
  styleUrls: ['./order-states-dialog.component.scss']
})
export class OrderStatesDialogComponent implements OnInit {
  pending: boolean;
  processing: boolean;
  shipping: boolean;
  completed: boolean;
  ready: boolean;
  disabled: OrderState[];
  hidden: OrderState[];

  OrderState = OrderState;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>,
  ) {
    const states: OrderState[] = this.data.orderStates;
    this.disabled = this.data.disabled;
    this.hidden = this.data.hidden;

    try {
      this.pending = states.indexOf(OrderState.Pending) > -1;
      this.processing = states.indexOf(OrderState.Processing) > -1;
      this.shipping = states.indexOf(OrderState.Shipping) > -1;
      this.completed = states.indexOf(OrderState.Completed) > -1;
      this.ready = states.indexOf(OrderState.Ready) > -1;
    } catch (error) {
      
    }
  }

  ngOnInit(): void {
  }

  save() {
    const states: OrderState[] = [];
    if (this.pending) states.push(OrderState.Pending);
    if (this.processing) states.push(OrderState.Processing);
    if (this.shipping) states.push(OrderState.Shipping);
    if (this.completed) states.push(OrderState.Completed);
    if (this.ready) states.push(OrderState.Ready);
    
    this.dialogRef.close(states);
  }
}

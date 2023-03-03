import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { OrderType } from '@menno/types';

@Component({
  selector: 'select-order-type-modal',
  templateUrl: './select-order-type-modal.component.html',
  styleUrls: ['./select-order-type-modal.component.scss'],
})
export class SelectOrderTypeModalComponent {
  OrderType = OrderType;

  constructor(private _ref: MatBottomSheetRef) {}

  select(type: OrderType) {
    this._ref.dismiss(type);
  }
}

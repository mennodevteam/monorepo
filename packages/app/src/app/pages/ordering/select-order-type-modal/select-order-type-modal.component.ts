import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { OrderType } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'select-order-type-modal',
  templateUrl: './select-order-type-modal.component.html',
  styleUrls: ['./select-order-type-modal.component.scss'],
})
export class SelectOrderTypeModalComponent {
  OrderType = OrderType;

  constructor(private _ref: MatBottomSheetRef, private shopService: ShopService) {}

  select(type: OrderType) {
    if (this.selectableOrderTypes.indexOf(type) > -1) this._ref.dismiss(type);
  }

  get selectableOrderTypes() {
    return this.shopService.shop?.appConfig?.selectableOrderTypes || [];
  }
}

import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'shop-info-modal',
  templateUrl: './shop-info-modal.component.html',
  styleUrls: ['./shop-info-modal.component.scss'],
})
export class ShopInfoModalComponent {
  constructor(private shopService: ShopService, public ref: MatBottomSheetRef) {}

  get shop() {
    return this.shopService.shop
  }
}

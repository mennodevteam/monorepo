import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ShopInfoModalComponent } from '../shop-info-modal/shop-info-modal.component';

@Component({
  selector: 'shop-welcome',
  templateUrl: './shop-welcome.component.html',
  styleUrls: ['./shop-welcome.component.scss'],
})
export class ShopWelcomeComponent {
  constructor(private shopService: ShopService, private bottomSheet: MatBottomSheet) {}

  get shop() {
    return this.shopService.shop;
  }

  openShopInfoModal() {
    this.bottomSheet.open(ShopInfoModalComponent);
  }
}

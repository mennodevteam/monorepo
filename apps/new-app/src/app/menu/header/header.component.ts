import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderType, Shop } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { AlertBannerComponent, OrderTypeBottomSheetComponent } from '../../common/components';
import { MenuService, ShopService } from '../../core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule, MatBottomSheetModule, AlertBannerComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  OrderType = OrderType;
  @Output() searchClick = new EventEmitter<void>();

  constructor(
    private bottomSheet: MatBottomSheet,
    public menu: MenuService,
    public shopService: ShopService,
  ) {}

  orderTypeClick() {
    this.bottomSheet.open(OrderTypeBottomSheetComponent);
  }

  get shop() {
    return this.shopService.shop;
  }
}

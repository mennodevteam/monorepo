import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderType, Shop } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { OrderTypeBottomSheetComponent } from '../../common/components';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule, MatBottomSheetModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() shop: Shop;
  OrderType = OrderType;

  constructor(private bottomSheet: MatBottomSheet) {}

  orderTypeClick() {
    this.bottomSheet.open(OrderTypeBottomSheetComponent);
  }
}

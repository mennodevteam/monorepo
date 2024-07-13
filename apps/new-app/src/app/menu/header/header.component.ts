import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderType, Shop } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { OrderTypeBottomSheetComponent } from '../../common/components';
import { MenuService } from '../../core';

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
  @Output() searchClick = new EventEmitter<void>()

  constructor(private bottomSheet: MatBottomSheet, public menu: MenuService) {}

  orderTypeClick() {
    this.bottomSheet.open(OrderTypeBottomSheetComponent);
  }
}

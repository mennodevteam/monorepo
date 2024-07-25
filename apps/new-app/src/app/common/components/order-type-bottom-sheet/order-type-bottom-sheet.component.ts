import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';
import { MatRadioModule } from '@angular/material/radio';
import { OrderType } from '@menno/types';
import { MenuService, ShopService } from '../../../core';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-order-type-bottom-sheet',
  standalone: true,
  imports: [CommonModule, COMMON, MatRadioModule, FormsModule, MatListModule],
  templateUrl: './order-type-bottom-sheet.component.html',
  styleUrl: './order-type-bottom-sheet.component.scss',
})
export class OrderTypeBottomSheetComponent {
  OrderType = OrderType;
  type: OrderType[] = [];
  constructor(
    public shopService: ShopService,
    private menu: MenuService,
    public sheetRef: MatBottomSheetRef<any>,
  ) {
    const type = this.menu.type();
    this.type = type != undefined ? [type] : [];
  }

  save() {
    this.menu.type.set(this.type[0]);
    this.sheetRef.dismiss();
  }
}

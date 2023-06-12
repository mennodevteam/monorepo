import { Component, Inject, Optional } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'ding-bottom-sheet',
  templateUrl: './ding-bottom-sheet.component.html',
  styleUrls: ['./ding-bottom-sheet.component.scss'],
})
export class DingBottomSheetComponent {
  dings: string[];
  constructor(
    private shopService: ShopService,
    public sheetRef: MatBottomSheetRef<DingBottomSheetComponent>,
  ){
    this.dings = this.shopService.shop?.appConfig?.dings || [];
  }
}

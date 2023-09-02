import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ShopTable } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'app-shop-tables-bottom-sheet',
  templateUrl: './shop-tables-bottom-sheet.component.html',
  styleUrls: ['./shop-tables-bottom-sheet.component.scss'],
})
export class ShopTablesBottomSheetComponent implements OnInit {
  tables: ShopTable[];
  constructor(private shopService: ShopService, public sheetRef: MatBottomSheetRef<any>) {}

  ngOnInit(): void {
    try {
      this.tables = this.shopService.shop?.details.tables || [];
      this.tables.sort((a, b) => (a.code < b.code ? -1 : 1));
    } catch (error) {
      this.tables = [];
    }
  }
}

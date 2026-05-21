import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { ShopTable } from '@menno/types';
import { COMMON } from '../..';
import { ShopService } from '../../../core';

@Component({
  selector: 'app-shop-tables-bottom-sheet',
  standalone: true,
  imports: [COMMON, MatListModule],
  templateUrl: './shop-tables-bottom-sheet.component.html',
  styleUrl: './shop-tables-bottom-sheet.component.scss',
})
export class ShopTablesBottomSheetComponent implements OnInit {
  tables: ShopTable[] = [];

  constructor(
    private shopService: ShopService,
    public sheetRef: MatBottomSheetRef<ShopTable | undefined>,
  ) {}

  ngOnInit(): void {
    try {
      this.tables = [...(this.shopService.shop?.details?.tables || [])];
      this.tables.sort((a, b) => (a.code < b.code ? -1 : 1));
    } catch {
      this.tables = [];
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { ShopTable } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'app-table-selector-dialog',
  templateUrl: './table-selector-dialog.component.html',
  styleUrls: ['./table-selector-dialog.component.scss']
})
export class TableSelectorDialogComponent implements OnInit {
  tables: ShopTable[];
  constructor(
    private shopService: ShopService,
  ) { }

  ngOnInit(): void {
    this.tables = this.shopService.instant.details.tables || [];
    this.tables.sort((a, b) => a.code < b.code ? -1 : 1);
  }

}

import { Component } from '@angular/core';
import { OrderType } from '@menno/types';
import { PosService } from '../../../core/services/pos.service';
import { MatDialog } from '@angular/material/dialog';
import { TableSelectorDialogComponent } from '../../../shared/dialogs/table-selector-dialog/table-selector-dialog.component';

@Component({
  selector: 'left-section',
  templateUrl: './left-section.component.html',
  styleUrls: ['./left-section.component.scss'],
})
export class LeftSectionComponent {
  OrderType = OrderType;
  constructor(public POS: PosService, private dialog: MatDialog) {}

  selectTable() {
    this.dialog
      .open(TableSelectorDialogComponent)
      .afterClosed()
      .subscribe((table: any) => {
        if (table) {
          this.POS.details = { ...(this.POS.details || {}), table: table.code };
        }
      });
  }
}

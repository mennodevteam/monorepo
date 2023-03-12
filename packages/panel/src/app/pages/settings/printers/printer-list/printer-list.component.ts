import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShopPrintView } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { PrinterService } from 'packages/panel/src/app/core/services/printer.service';
import { AlertDialogComponent } from 'packages/panel/src/app/shared/dialogs/alert-dialog/alert-dialog.component';

@Component({
  selector: 'printer-list',
  templateUrl: './printer-list.component.html',
  styleUrls: ['./printer-list.component.scss'],
})
export class PrinterListComponent {
  constructor(public PS: PrinterService, private dialog: MatDialog, private translate: TranslateService) {}
  get printers() {
    return this.PS.printers;
  }

  remove(p: ShopPrintView) {
    this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('printers.remove.title', { value: p.title }),
          description: this.translate.instant('printers.remove.description'),
        },
      })
      .afterClosed()
      .subscribe((val) => {
        if (val) {
          this.PS.remove(p);
        }
      });
  }
}

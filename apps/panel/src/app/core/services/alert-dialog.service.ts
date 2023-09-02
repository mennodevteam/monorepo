import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AlertDialogService {

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService, 
  ) { }

  removeItem(title: string) {
    return this.dialog.open(AlertDialogComponent, {
      data: {
        title: this.translate.instant('removeDialog.title', {value: title}),
        description: this.translate.instant('removeDialog.description', {value: title}),
      }
    }).afterClosed().toPromise();
  }
}

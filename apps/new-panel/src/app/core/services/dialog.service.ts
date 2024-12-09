import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  PromptDialogComponent,
  PromptFields,
} from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialog = inject(MatDialog);

  async prompt(title: string, fields: PromptFields, extra?: { config?: MatDialogConfig }) {
    return this.dialog
      .open(PromptDialogComponent, {
        ...extra?.config,
        data: { title, fields },
      })
      .afterClosed()
      .toPromise();
  }

  async alert(title: string, description: PromptFields, extra?: { config?: MatDialogConfig }) {
    return this.dialog
      .open(AlertDialogComponent, {
        ...extra?.config,
        data: { title, description },
      })
      .afterClosed()
      .toPromise();
  }
}

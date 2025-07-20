import { Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.scss',
})
export class AlertDialogComponent {
  readonly data = inject<{ title: string; description?: string, okText?: string, cancelText?: string, hideCancel?: boolean }>(
    MAT_DIALOG_DATA,
  );
  readonly title = this.data.title;
  readonly description = this.data.description;
  readonly okText = this.data.okText;
  readonly cancelText = this.data.cancelText;
  readonly hideCancel = this.data.hideCancel;
}

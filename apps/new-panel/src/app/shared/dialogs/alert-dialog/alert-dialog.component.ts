import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
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

import { Component, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'walkthrough-dialog',
  templateUrl: './walkthrough-dialog.component.html',
  styleUrl: './walkthrough-dialog.component.scss',
})
export class WalkthroughDialogComponent {
  readonly dialogRef = inject(MatDialogRef<WalkthroughDialogComponent>);
  readonly data = inject<{
    image: string,
    title: string,
    description: string,
    action?: string,
  }>(MAT_DIALOG_DATA);
  readonly image = model(this.data.image);
  readonly title = model(this.data.title);
  readonly description = model(this.data.description);
  readonly action = model(this.data.action);
}

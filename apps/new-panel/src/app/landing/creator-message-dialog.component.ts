import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SHARED } from '../shared';

@Component({
  selector: 'app-creator-message-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatDialogModule,
  ],
  templateUrl: './creator-message-dialog.component.html',
  styleUrl: './creator-message-dialog.component.scss',
})
export class CreatorMessageDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreatorMessageDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }
}

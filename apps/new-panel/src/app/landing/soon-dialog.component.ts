import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SHARED } from '../shared';

@Component({
  selector: 'app-soon-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatDialogModule,
  ],
  templateUrl: './soon-dialog.component.html',
  styleUrl: './soon-dialog.component.scss',
})
export class SoonDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SoonDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }
}

import { Component, inject } from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { SHARED } from '../..';
import { MatListModule } from '@angular/material/list';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

export type TableColsVisibility = {
  text: string;
  visible: boolean;
};

@Component({
  selector: 'app-table-cols-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatListModule,
    MatDialogModule,
    DragDropModule
],
  templateUrl: './table-cols-dialog.component.html',
  styleUrl: './table-cols-dialog.component.scss',
})
export class TableColsDialogComponent {
  readonly data = inject<TableColsVisibility[]>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<TableColsDialogComponent>);

  drop(event: CdkDragDrop<TableColsVisibility[]>) {
    const items = this.data;
    if (items) {
      moveItemInArray(items, event.previousIndex, event.currentIndex);
    }
  }
}

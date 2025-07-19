import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SHARED } from '../..';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatChipsModule } from '@angular/material/chips';

export type SortItem = { text: string; id: any };
@Component({
  selector: 'app-sort-dialog',
  standalone: true,
  imports: [CommonModule, SHARED, MatDialogModule, CdkDropList, CdkDrag, MatChipsModule],
  templateUrl: './sort-dialog.component.html',
  styleUrl: './sort-dialog.component.scss',
})
export class SortDialogComponent {
  readonly data = inject<{
    title: string;
    items: SortItem[];
  }>(MAT_DIALOG_DATA);

  drop(event: CdkDragDrop<SortItem[]>) {
    moveItemInArray(this.data.items, event.previousIndex, event.currentIndex);
  }
}

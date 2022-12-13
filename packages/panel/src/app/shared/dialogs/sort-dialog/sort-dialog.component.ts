import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sort-dialog',
  templateUrl: './sort-dialog.component.html',
  styleUrls: ['./sort-dialog.component.scss']
})
export class SortDialogComponent implements OnInit {
  items: { id: number, title: string }[];
  title: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
  ) { }

  ngOnInit(): void {
    this.items = this.data.items;
    this.title = this.data.title;
    console.log(this.items);
  }

  down(i: number) {
    const t = this.items[i];
    this.items[i] = this.items[i + 1];
    this.items[i + 1] = t;
  }

  up(i: number) {
    const t = this.items[i];
    this.items[i] = this.items[i - 1];
    this.items[i - 1] = t;
  }

  save() {
    this.dialogRef.close(this.items.map(x => x.id));
  }
}

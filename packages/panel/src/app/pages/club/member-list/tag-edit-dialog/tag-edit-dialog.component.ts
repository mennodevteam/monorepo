import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MemberTag } from '@menno/types';

const COLORS = [
  '#e57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64b5f6',
  '#4fc3f7', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#dce775',
  '#fff176', '#ffd54f', '#ffb74d', '#ff8a65', '#a1887f', '#90a4ae'
]

@Component({
  selector: 'app-tag-edit-dialog',
  templateUrl: './tag-edit-dialog.component.html',
  styleUrls: ['./tag-edit-dialog.component.scss']
})
export class TagEditDialogComponent implements OnInit {
  colors = COLORS;
  title: string;
  value: string;
  color: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
  ) { }

  ngOnInit(): void {
    this.title = this.data.title;
    this.value = this.data.value;
    this.color = this.data.color || COLORS[0];
  }

  save() {
    if (this.color && this.value) {
      const res = new MemberTag();
      res.title = this.value;
      res.color = this.color;
      this.dialogRef.close(res);
    }
  }
}

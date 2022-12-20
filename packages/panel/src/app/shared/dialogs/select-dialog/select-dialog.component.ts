import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export type SelectItem = {
  title: string;
  subtitle?: string;
  iconClass?: string;
  value: any;
};

@Component({
  selector: 'menno-select-dialog',
  templateUrl: './select-dialog.component.html',
  styleUrls: ['./select-dialog.component.scss'],
})
export class SelectDialogComponent implements OnInit {
  title: string;
  description = 'یکی از گزینه های زیر را انتخاب کنید:';
  items: SelectItem[];
  cancelText = 'انصراف';
  hideCancel = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<any>) {}

  ngOnInit(): void {
    this.title = this.data.title;
    this.items = this.data.items;
    if (this.data.description) this.description = this.data.description;
    if (this.data.cancelText) this.cancelText = this.data.cancelText;
    if (this.data.hideCancel) this.hideCancel = this.data.hideCancel;
  }
}

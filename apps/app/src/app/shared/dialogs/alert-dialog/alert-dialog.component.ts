import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss']
})
export class AlertDialogComponent implements OnInit {
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  hideOk?: boolean;
  hideCancel?: boolean;
  status?: string;
  okGtmLabel?: string;
  cancelGtmLabel?: string;
  okGtmCategory?: string;
  cancelGtmCategory?: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
  ) { }

  ngOnInit(): void {
    this.title = this.data.title;
    this.status = this.data.status;
    this.description = this.data.description;
    this.okText = this.data.okText;
    this.cancelText = this.data.cancelText;
    this.hideOk = this.data.hideOk;
    this.hideCancel = this.data.hideCancel;
    this.okGtmLabel = this.data.okGtmLabel;
    this.cancelGtmLabel = this.data.cancelGtmLabel;
    this.okGtmCategory = this.data.okGtmCategory;
    this.cancelGtmCategory = this.data.cancelGtmCategory;
  }
}

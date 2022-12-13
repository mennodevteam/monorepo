import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.scss']
})
export class AlertDialogComponent implements OnInit {
  title: string;
  description: string;
  okText: string;
  cancelText: string;
  hideCancel: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
  ) { }

  ngOnInit(): void {
    this.title = this.data.title;
    this.description = this.data.description;
    this.okText = this.data.okText;
    this.cancelText = this.data.cancelText;
    this.hideCancel = this.data.hideCancel;
  }
}

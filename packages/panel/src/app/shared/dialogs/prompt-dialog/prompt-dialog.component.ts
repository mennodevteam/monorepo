import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-prompt-dialog',
  templateUrl: './prompt-dialog.component.html',
  styleUrls: ['./prompt-dialog.component.scss']
})
export class PromptDialogComponent implements OnInit {
  title: string;
  description: string;
  type: string;
  label: string;
  placeholder: string;
  hint: string;
  rows: number;
  okText: string;
  cancelText: string;
  value: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
  ) { }

  ngOnInit(): void {
    this.title = this.data.title;
    this.description = this.data.description;
    this.type = this.data.type;
    this.label = this.data.label;
    this.placeholder = this.data.placeholder;
    this.hint = this.data.hint;
    this.rows = this.data.rows;
    this.okText = this.data.okText;
    this.cancelText = this.data.cancelText;
    this.value = this.data.value;
  }

  save() {
    this.dialogRef.close(this.value);
  }

}

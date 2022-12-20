import { filter } from 'rxjs/operators';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export class PromptField {
  type?: string;
  options?: { text: string; value: any }[];
  groups?: { text: string; options: { text: string; value: any }[] }[];
  optionsDisplayProperty?: string;
  label: string;
  hint?: string;
  ltr?: boolean;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  control: FormControl;
}

export type PromptKeyFields = { [key: string]: PromptField };

@Component({
  selector: 'app-advanced-prompt-dialog',
  templateUrl: './advanced-prompt-dialog.component.html',
  styleUrls: ['./advanced-prompt-dialog.component.scss'],
})
export class AdvancedPromptDialogComponent implements OnInit {
  form: FormGroup;
  keys: string[];
  fields: PromptKeyFields;
  title: string;
  description: string;
  okText: string;
  cancelText: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>
  ) {
    this.fields = this.data.fields;
    this.title = this.data.title;
    this.description = this.data.description;
    this.okText = this.data.okText;
    this.cancelText = this.data.cancelText;

    const controls: any = {};

    for (const key in this.fields) {
      if (Object.prototype.hasOwnProperty.call(this.fields, key)) {
        const field = this.fields[key];
        controls[key] = field.control;
        if (field.disabled) field.control.disable();
      }
    }
    this.keys = Object.keys(this.fields);
    this.form = new FormGroup(controls);
  }

  ngOnInit(): void {}

  submit(): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      for (const key in this.fields) {
        if (Object.prototype.hasOwnProperty.call(this.fields, key)) {
          if (value[key] == undefined) delete value[key];
          else {
            const field = this.fields[key];
            if (field.type === 'number' && value[key] != undefined) value[key] = Number(value[key]);
            else if (field.type === 'datepicker' && value[key] != undefined) value[key] = value[key] ? value[key]._d || value[key] : undefined;
          }
        }
      }
      console.log(value);
      this.dialogRef.close(value);
    }
  }
}

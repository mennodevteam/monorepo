import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SHARED } from '../..';
import { MatSelectModule } from '@angular/material/select';

export type PromptFields = { [key: string]: PromptField };
export type PromptField = {
  label?: string;
  type?: string;
  control: FormControl;
  options?: { value: any; text: string }[];
  hint?: string;
  placeholder?: string;
  rows?: number;
  ltr?: boolean;
};

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
  ],
  templateUrl: './prompt-dialog.component.html',
  styleUrl: './prompt-dialog.component.scss',
})
export class PromptDialogComponent {
  readonly data = inject<{
    title: string;
    description?: string;
    fields: PromptFields;
  }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<PromptDialogComponent>);
  readonly title = this.data.title;
  readonly description = this.data.description;
  readonly fields = this.data.fields;
  readonly keys = Object.keys(this.fields);

  submit() {
    const dto: any = {};
    for (const key in this.fields) {
      const field = this.fields[key];
      if (field.control.invalid) return;
      if (field.control.value)
        dto[key] = field.type === 'date' ? new Date(field.control.value.valueOf()) : field.control.value;
    }
    this.dialogRef.close(dto);
  }
}

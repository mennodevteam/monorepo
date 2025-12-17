import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { SHARED } from '../../shared';

export interface DateRangeDialogData {
  title: string;
  description?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface DateRangeDialogResult {
  fromDate?: Date;
  toDate?: Date;
}

@Component({
  selector: 'app-date-range-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './date-range-dialog.component.html',
  styleUrl: './date-range-dialog.component.scss',
})
export class DateRangeDialogComponent {
  readonly data = inject<DateRangeDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DateRangeDialogComponent>);

  form = new FormGroup({
    fromDate: new FormControl<Date | null>(this.data.fromDate || null),
    toDate: new FormControl<Date | null>(this.data.toDate || null),
  });

  submit() {
    if (this.form.valid) {
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      
      if (this.form.value.fromDate) {
        fromDate = new Date(this.form.value.fromDate);
        fromDate.setHours(0, 0, 0, 0);
      }
      if (this.form.value.toDate) {
        toDate = new Date(this.form.value.toDate);
        toDate.setHours(23, 59, 59, 999);
      }
      
      this.dialogRef.close({
        fromDate: fromDate,
        toDate: toDate,
      } as DateRangeDialogResult);
    }
  }
}



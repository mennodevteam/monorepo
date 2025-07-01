import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SHARED } from '../../../shared';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-member-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    SHARED,
    MatSliderModule,
  ],
  templateUrl: './member-filter-dialog.component.html',
})
export class MemberFilterDialogComponent {
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MemberFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.filterForm = this.fb.group({
      firstOrderFromDate: [data?.firstOrderFromDate || null],
      firstOrderToDate: [data?.firstOrderToDate || null],
      lastOrderFromDate: [data?.lastOrderFromDate || null],
      lastOrderToDate: [data?.lastOrderToDate || null],
      joinedAtFromDate: [data?.joinedAtFromDate || null],
      joinedAtToDate: [data?.joinedAtToDate || null],
      lastVisitFromDate: [data?.lastVisitFromDate || null],
      lastVisitToDate: [data?.lastVisitToDate || null],
      fromStar: [data?.fromStar || 0],
      toStar: [data?.toStar || 5],
    });
  }

  onApply() {
    const value = { ...this.filterForm.value };
    const startKeys = ['firstOrderFromDate', 'lastOrderFromDate', 'joinedAtFromDate', 'lastVisitFromDate'];
    const endKeys = ['firstOrderToDate', 'lastOrderToDate', 'joinedAtToDate', 'lastVisitToDate'];
    startKeys.forEach((key) => {
      if (value[key]) {
        const d = new Date(value[key]);
        d.setHours(0, 0, 0, 0);
        value[key] = d;
      }
    });
    endKeys.forEach((key) => {
      if (value[key]) {
        const d = new Date(value[key]);
        d.setHours(23, 59, 59, 999);
        value[key] = d;
      }
    });
    this.dialogRef.close(value);
  }
}

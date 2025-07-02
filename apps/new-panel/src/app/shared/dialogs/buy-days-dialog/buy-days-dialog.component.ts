import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SHARED } from '../..';

@Component({
  selector: 'app-buy-days-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './buy-days-dialog.component.html',
  styleUrl: './buy-days-dialog.component.scss',
})
export class BuyDaysDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BuyDaysDialogComponent>);

  form: FormGroup = this.fb.group({
    days: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  get totalAmount(): number {
    const days = this.form.get('days')?.value || 0;
    return days * 60000;
  }

  get formattedTotalAmount(): string {
    return this.totalAmount.toLocaleString('fa-IR');
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        days: this.form.get('days')?.value,
        totalAmount: this.totalAmount,
      });
    }
  }
}

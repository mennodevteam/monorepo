import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddressesService } from '../../../../core/services/addresses.service';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>افزودن آدرس جدید</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 pt-4">
        <mat-form-field appearance="outline">
          <mat-label>عنوان آدرس</mat-label>
          <input matInput formControlName="title" placeholder="مثال: خانه، محل کار" />
        </mat-form-field>

        <div class="flex gap-4">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>شهر</mat-label>
            <input matInput formControlName="city" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>منطقه/محله</mat-label>
            <input matInput formControlName="region" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>آدرس دقیق</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>انصراف</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || loading" (click)="save()">
        @if (loading) {
          <mat-spinner diameter="16"></mat-spinner>
        } @else {
          ثبت آدرس
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class AddressDialogComponent {
  fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<AddressDialogComponent>);
  addressesService = inject(AddressesService);

  loading = false;

  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    city: ['', Validators.required],
    region: ['', Validators.required],
    description: ['', Validators.required],
  });

  async save() {
    if (this.form.valid) {
      this.loading = true;
      try {
        await this.addressesService.save(this.form.value);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving address:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}

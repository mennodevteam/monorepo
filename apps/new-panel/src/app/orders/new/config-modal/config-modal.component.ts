import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SHARED } from '../../../shared';

export interface OrderConfigData {
  orderDateTime: Date;
  useCurrentDateTime: boolean;
  excludeFromReport: boolean;
  extraCost: number;
}

@Component({
  selector: 'app-config-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    MatTimepickerModule,
    SHARED
  ],
  templateUrl: './config-modal.component.html',
  styleUrl: './config-modal.component.scss',
})
export class ConfigModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ConfigModalComponent>);
  private readonly data = inject<OrderConfigData>(MAT_DIALOG_DATA);

  @Output() configSaved = new EventEmitter<OrderConfigData>();

  configForm: FormGroup;

  constructor() {
    const initialDate = this.data?.orderDateTime ? new Date(this.data.orderDateTime) : new Date();

    this.configForm = this.fb.group({
      useCurrentDateTime: [this.data?.useCurrentDateTime ?? true],
      orderDate: [initialDate, Validators.required],
      orderTimeHour: [initialDate.getHours(), Validators.required],
      excludeFromReport: [this.data?.excludeFromReport ?? false],
      extraCost: [this.data?.extraCost ?? 0, [Validators.required, Validators.min(0)]],
    });

    // Disable date/time pickers when use current date time is checked
    this.configForm.get('useCurrentDateTime')?.valueChanges.subscribe((useCurrent) => {
      const dateControl = this.configForm.get('orderDate');
      const timeControl = this.configForm.get('orderTime');
      if (useCurrent) {
        dateControl?.disable();
        timeControl?.disable();
      } else {
        dateControl?.enable();
        timeControl?.enable();
      }
    });

    // Set initial state
    if (this.configForm.get('useCurrentDateTime')?.value) {
      this.configForm.get('orderDate')?.disable();
      this.configForm.get('orderTime')?.disable();
    }
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:mm format
  }

  onSave(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      let orderDateTime: Date;

      if (formValue.useCurrentDateTime) {
        orderDateTime = new Date();
      } else {
        // Combine date and time
        const date = new Date(formValue.orderDate);
        date.setHours(formValue.orderTimeHour, 0, 0, 0);
        orderDateTime = date;
      }

      const config: OrderConfigData = {
        orderDateTime,
        useCurrentDateTime: formValue.useCurrentDateTime,
        excludeFromReport: formValue.excludeFromReport,
        extraCost: formValue.extraCost,
      };

      this.configSaved.emit(config);
      this.dialogRef.close(config);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

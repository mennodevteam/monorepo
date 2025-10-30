import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeliveryArea, Status, DeliveryType, Region } from '@menno/types';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { REGIONS } from '../../../core/constants/regions';
import { SHARED } from '../../../shared';

@Component({
  selector: 'app-delivery-area-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    SHARED,
  ],
  templateUrl: './delivery-area-edit-dialog.component.html',
  styleUrl: './delivery-area-edit-dialog.component.scss',
})
export class DeliveryAreaEditDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeliveryAreaEditDialogComponent>);
  readonly data = inject<{ area?: DeliveryArea; polygon?: [number, number][]; deliveryType?: DeliveryType }>(
    MAT_DIALOG_DATA,
  );
  readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  readonly Status = Status;
  readonly DeliveryType = DeliveryType;
  readonly form: FormGroup;
  readonly regions = REGIONS;
  readonly states: string[];

  areaType: 'all' | 'region' = 'all';
  selectedState?: string;

  constructor() {
    const area = this.data?.area;

    // Determine area type from existing data
    if (area?.region || area?.state) {
      this.areaType = 'region';
      this.selectedState = area.region?.state || area.state;
    }

    // Get unique states from regions
    this.states = [...new Set(this.regions.map((r) => r.state).filter((s): s is string => !!s))].sort();

    this.form = this.fb.group({
      title: [area?.title || '', [Validators.required]],
      label: [area?.label || ''],
      price: [area?.price || 0, [Validators.required]],
      percentagePrice: [area?.percentagePrice || 0],
      minOrderPrice: [area?.minOrderPrice || 0],
      minPriceForFree: [area?.minPriceForFree || 0],
      state: [area?.state || null],
      region: [area?.region?.id || null],
    });
  }

  get filteredRegions(): Region[] {
    const state = this.selectedState || this.form?.get('state')?.value;
    if (!state) return [];
    return this.regions.filter((r) => r.state === state);
  }

  onAreaTypeChange(type: 'all' | 'region') {
    this.areaType = type;
    this.selectedState = undefined;
    this.form.patchValue({
      state: null,
      region: null,
    });
  }

  onStateChange(state: string) {
    this.selectedState = state;
    this.form.patchValue({
      state: state,
      region: null,
    });
  }

  save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const dto: Partial<DeliveryArea> = {
        title: formValue.title,
        label: formValue.label,
        price: formValue.price,
        percentagePrice: formValue.percentagePrice,
        minOrderPrice: formValue.minOrderPrice || 0,
        minPriceForFree: formValue.minPriceForFree || 0,
      };

      // Handle area type
      if (this.data?.deliveryType === DeliveryType.Post) {
        if (this.areaType === 'region') {
          if (formValue.region) {
            // Specific region selected
            dto.region = this.regions.find((r) => r.id === formValue.region);
            dto.state = undefined;
          } else if (formValue.state) {
            // Only state selected (all regions in state)
            dto.state = formValue.state;
            dto.region = undefined;
          }
        } else {
          // All country
          dto.state = undefined;
          dto.region = undefined;
        }
      } else {
        dto.polygon = this.data?.polygon || this.data?.area?.polygon || [];
      }

      if (this.data?.area) dto.id = this.data.area.id;

      this.dialogRef.close(dto);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}

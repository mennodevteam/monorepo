import { Component, inject } from '@angular/core';

import { SHARED } from '../..';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RegionAutocompleteComponent } from '../../components/region-autocomplete/region-autocomplete.component';
import { Address, DeliveryArea } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-address-form-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RegionAutocompleteComponent,
    MatSelectModule
],
  templateUrl: './address-form-dialog.component.html',
  styleUrl: './address-form-dialog.component.scss',
})
export class AddressFormDialogComponent {
  private readonly http = inject(HttpClient);
  readonly data = inject<{ address?: Address }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AddressFormDialogComponent>);
  form = new FormGroup({
    title: new FormControl(this.data?.address?.title),
    description: new FormControl(this.data?.address?.description, Validators.required),
    region: new FormControl(this.data?.address?.region),
    unit: new FormControl(this.data?.address?.unit),
    ring: new FormControl(this.data?.address?.ring),
    postalCode: new FormControl(this.data?.address?.postalCode),
    deliveryArea: new FormControl(this.data?.address?.deliveryArea, Validators.required),
  });

  deliveryAreaQuery = injectQuery(() => ({
    queryKey: ['deliveryArea'],
    queryFn: () => lastValueFrom(this.http.get<DeliveryArea[]>(`/deliveryAreas`)),
  }));

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}

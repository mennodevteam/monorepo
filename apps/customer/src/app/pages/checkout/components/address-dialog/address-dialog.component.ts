import { Component, computed, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { Address, Region, State } from '@menno/types';
import { AddressesService } from '../../../../core/services/addresses.service';
import { REGIONS } from '../../../../core/constants/regions';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './address-dialog.component.html',
  styleUrls: ['./address-dialog.component.scss'],
})
export class AddressDialogComponent implements AfterViewInit {
  dialogRef = inject(MatDialogRef<AddressDialogComponent>);
  addressesService = inject(AddressesService);
  data = inject<Address | undefined>(MAT_DIALOG_DATA, { optional: true });

  address?: Address;
  loading = signal<boolean>(false);
  states = Region.states(REGIONS);
  regionState = signal<State | null>(null);
  regions = computed(() => {
    const state = this.regionState();
    return state?.regions || [];
  });
  @ViewChild('regionStateElem') regionStateElem?: MatSelect;

  form: FormGroup = new FormGroup({
    region: new FormControl<Region | null>(null, Validators.required),
    title: new FormControl<string>(''),
    description: new FormControl<string>('', Validators.required),
    unit: new FormControl<string>('', Validators.required),
    ring: new FormControl<string>('', Validators.required),
    postalCode: new FormControl<string>(''),
  });

  constructor() {
    this.address = this.data || undefined;
    if (this.address) {
      this.form.patchValue({
        region: this.address.region,
        title: this.address.title || '',
        description: this.address.description,
        unit: this.address.unit || '',
        ring: this.address.ring || '',
        postalCode: this.address.postalCode || '',
      });
    }
  }

  ngAfterViewInit() {
    this.findAndSetRegion();
  }

  findAndSetRegion() {
    if (this.address?.region) {
      const state = this.states.find((x) => x.title === this.address?.region?.state);
      if (state) {
        this.regionState.set(state);
        if (this.regionStateElem) {
          this.regionStateElem.value = state;
        }
      }
    }
  }

  get dto(): Address {
    const dto: Address = this.form.getRawValue() as Address;
    if (this.address) dto.id = this.address.id;
    return dto;
  }

  async save() {
    if (this.form.valid) {
      this.loading.set(true);
      try {
        await this.addressesService.save(this.dto);
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving address:', error);
      } finally {
        this.loading.set(false);
      }
    }
  }
}

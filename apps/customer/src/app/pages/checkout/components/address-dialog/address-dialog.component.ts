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
import { REGIONS } from '../../../../../../../new-app/src/app/core/constants/regions';

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
  template: `
    <h2 mat-dialog-title>{{ address ? 'ویرایش آدرس' : 'افزودن آدرس جدید' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="address-form">
        <mat-form-field appearance="outline">
          <mat-label>استان</mat-label>
          <mat-select
            #regionStateElem
            [value]="regionState()"
            (valueChange)="regionState.set($event)"
            required
          >
            @for (state of states; track state.title) {
              <mat-option [value]="state">
                {{ state.title }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>شهر/منطقه</mat-label>
          <mat-select formControlName="region" required>
            @for (region of regions(); track region.id) {
              <mat-option [value]="region">
                {{ region.title }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>آدرس دقیق</mat-label>
          <textarea matInput formControlName="description" rows="3" required></textarea>
        </mat-form-field>

        <div class="row-fields">
          <mat-form-field appearance="outline">
            <mat-label>واحد</mat-label>
            <input matInput formControlName="unit" type="text" required />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>زنگ</mat-label>
            <input matInput formControlName="ring" type="text" required />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>کد پستی</mat-label>
          <input matInput formControlName="postalCode" type="text" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>عنوان آدرس</mat-label>
          <input matInput formControlName="title" type="text" placeholder="مثال: خانه، محل کار" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>انصراف</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || loading()" (click)="save()">
        @if (loading()) {
          <mat-spinner diameter="16"></mat-spinner>
        } @else {
          {{ address ? 'ویرایش' : 'ثبت' }} آدرس
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .address-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 16px;
      }

      mat-form-field {
        width: 100%;
      }

      .row-fields {
        display: flex;
        gap: 16px;
      }

      .row-fields mat-form-field {
        flex: 1;
      }
    `,
  ],
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

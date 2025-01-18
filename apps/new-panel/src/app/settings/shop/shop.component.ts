import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { BusinessCategory, Region, State } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { DialogService } from '../../core/services/dialog.service';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { REGIONS } from '../../core/constants';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatChipsModule,
    FormsModule,
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements FormComponent {
  private readonly shopService = inject(ShopService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly states = Region.states(REGIONS);
  readonly categories = Object.values(BusinessCategory);
  selectedState = signal<State | undefined>(undefined);

  form = this.fb.group({
    title: [this.shopService.data()?.title, Validators.required],
    businessCategory: [this.shopService.data()?.businessCategory, Validators.required],
    description: [this.shopService.data()?.description],
    instagram: [this.shopService.data()?.instagram],
    phones: [this.shopService.data()?.phones || []],
    address: [this.shopService.data()?.address],
    region: [this.getRegion()],
    latitude: [this.shopService.data()?.latitude],
    longitude: [this.shopService.data()?.longitude],
    logoImage: [(this.shopService.data()?.logoImage || this.shopService.data()?.logo) as any],
  });

  private getRegion() {
    const region = this.shopService.data()?.region
      ? REGIONS.find((item) => item.id === this.shopService.data()?.region?.id)
      : null;
    if (region) {
      const state = this.states.find((item) => item.title === region.state);
      this.selectedState.set(state);
    }
    return region;
  }

  editLogo() {
    this.dialog.imageCropper().then((res) => {
      if (res) {
        this.form.controls.logoImage.setValue(res);
        this.form.markAsDirty();
      }
    });
  }

  addPhone(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.form.controls.phones?.value?.push(value);
    }
    event.chipInput!.clear();
    this.form.markAsDirty();
  }

  removePhone(phone: string): void {
    const index = this.form.controls.phones?.value?.indexOf(phone);

    if (index != undefined && index >= 0) {
      this.form.controls.phones?.value?.splice(index, 1);
    }
    this.form.markAsDirty();
  }

  canDeactivate() {
    return !this.form.dirty;
  }

  async submit() {
    const dto: any = this.form.getRawValue();
    if (dto.logoImage === null) dto.logo = null;
    try {
      this.form.markAsPristine();
      await this.shopService.saveMutation.mutateAsync(dto);
    } catch (error) {
      this.form.markAsDirty();
    }
  }
}

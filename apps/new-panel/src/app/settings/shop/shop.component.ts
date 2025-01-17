import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { BusinessCategory } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { DialogService } from '../../core/services/dialog.service';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

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
  ],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  private readonly shopService = inject(ShopService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  categories = Object.values(BusinessCategory);

  form = this.fb.group({
    title: [this.shopService.data()?.title, Validators.required],
    businessCategory: [this.shopService.data()?.businessCategory, Validators.required],
    description: [this.shopService.data()?.description],
    instagram: [this.shopService.data()?.instagram],
    phones: [this.shopService.data()?.phones || []],
    address: [this.shopService.data()?.address],
    region: [this.shopService.data()?.region],
    latitude: [this.shopService.data()?.latitude],
    longitude: [this.shopService.data()?.longitude],
    logoImage: [(this.shopService.data()?.logoImage || this.shopService.data()?.logo) as any],
  });

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
}

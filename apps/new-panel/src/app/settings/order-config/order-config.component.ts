import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OrderType, AppConfig } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { PersianNumberService } from '@menno/utils';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';

@Component({
  selector: 'app-order-config',
  standalone: true,
  templateUrl: './order-config.component.html',
  styleUrls: ['./order-config.component.scss'],
  imports: [
    SHARED,
    MatCardModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
  ],
})
export class OrderConfigComponent implements FormComponent {
  public readonly shopService = inject(ShopService);

  readonly OrderType = OrderType;
  readonly separatorKeysCodes = [ENTER] as const;

  get appConfig(): AppConfig {
    const data = this.shopService.data();
    if (!data || !data.appConfig) {
      throw new Error('Shop appConfig is not loaded');
    }
    return data.appConfig;
  }

  form = new FormGroup({
    disableOrdering: new FormControl(this.appConfig.disableOrdering),
    disablePayment: new FormControl(this.appConfig.disablePayment),
    selectableOrderTypes: new FormControl(this.appConfig.selectableOrderTypes),
    requiredPayment: new FormControl(this.appConfig.requiredPayment),
    smsOnNewOrder: new FormControl(this.appConfig?.smsOnNewOrder || []),
  });

  async save() {
    try {
      const appConfig = this.form.getRawValue();
      this.form.markAsPristine();
      await this.shopService.saveAppConfigMutation.mutateAsync({
        appConfig: appConfig as Partial<AppConfig>,
        shop: null,
      });
    } catch (error) {
      this.form.markAsDirty();
    }
  }

  canDeactivate() {
    return !this.form.dirty;
  }

  addSmsOnNewOrder(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const smsList = this.form.get('smsOnNewOrder')?.value || [];
      smsList.push(PersianNumberService.toEnglish(value));
      this.form.get('smsOnNewOrder')?.setValue([...smsList]);
      this.form.markAsDirty();
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeSmsOnNewOrder(phone: string): void {
    const smsList = this.form.get('smsOnNewOrder')?.value || [];
    const index = smsList.indexOf(phone);
    if (index >= 0) {
      smsList.splice(index, 1);
      this.form.get('smsOnNewOrder')?.setValue([...smsList]);
      this.form.markAsDirty();
    }
  }
}

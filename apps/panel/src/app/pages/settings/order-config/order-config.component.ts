import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { PersianNumberService } from '@menno/utils';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  standalone: false,
  selector: 'order-config',
  templateUrl: './order-config.component.html',
  styleUrls: ['./order-config.component.scss'],
})
export class OrderConfigComponent {
  form: FormGroup = new FormGroup({});
  saving = false;
  loading = true;
  OrderType = OrderType;
  readonly separatorKeysCodes = [ENTER] as const;

  constructor(
    public shopService: ShopService,
    public menu: MenuService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.load();
  }

  async load() {
    if (this.shopService.shop?.appConfig) {
      this.initForm();
      this.loading = false;
      this.shopService
        .loadShop()
        .then(() => {
          if (!this.form.dirty) {
            this.initForm();
          }
        })
        .catch(() => {});
      return;
    }

    this.loading = true;
    try {
      await this.shopService.loadShop();
      this.initForm();
    } catch (err) {
      console.error('Failed to load order config:', err);
      this.snack.open(this.translate.instant('error.somethingWentWrong') || 'خطا در بارگذاری اطلاعات', '', {
        duration: 4000,
      });
    } finally {
      this.loading = false;
    }
  }

  private initForm() {
    const config = this.appConfig;
    this.form = new FormGroup({
      disableOrdering: new FormControl(config.disableOrdering ?? false),
      disablePayment: new FormControl(config.disablePayment ?? false),
      disableOrderingText: new FormControl(config.disableOrderingText ?? ''),
      orderingTypes: new FormControl(config.orderingTypes ?? []),
      selectableOrderTypes: new FormControl(config.selectableOrderTypes ?? []),
      requiredPayment: new FormControl(config.requiredPayment ?? []),
      requiredRegister: new FormControl(config.requiredRegister ?? []),
      menuViewType: new FormControl(config.menuViewType ?? 0),
      disableOrderingOnClose: new FormControl(config.disableOrderingOnClose ?? false),
      ding: new FormControl(config.ding ?? false),
      dings: new FormControl(config.dings || []),
      smsOnNewOrder: new FormControl(config.smsOnNewOrder || []),
    });
  }

  get appConfig() {
    return this.shopService.shop?.appConfig || ({} as any);
  }

  async save() {
    const fv = this.form.getRawValue();
    if (this.form.invalid) return;
    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    try {
      await this.http.post('appConfigs', fv).toPromise();
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
        duration: 5000,
        panelClass: 'success',
      });
      this.form.markAsUntouched();
      this.form.markAsPristine();
      await this.shopService.loadShop();
    } catch (err) {
      console.error('Failed to save order config:', err);
      this.snack.open(this.translate.instant('error.somethingWentWrong') || 'خطا در ذخیره اطلاعات', '', {
        duration: 5000,
      });
    } finally {
      this.saving = false;
    }
  }

  addDing(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.form.get('dings')?.value.push(value);
    }
    event.chipInput!.clear();
    this.form.markAsDirty();
  }

  removeDing(phone: string): void {
    const index = this.form.get('dings')?.value?.indexOf(phone);

    if (index >= 0) {
      this.form.get('dings')?.value.splice(index, 1);
    }
    this.form.markAsDirty();
  }

  addSmsOnNewOrder(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.form.get('smsOnNewOrder')?.value.push(PersianNumberService.toEnglish(value));
    }
    event.chipInput!.clear();
    this.form.markAsDirty();
  }

  removeSmsOnNewOrder(phone: string): void {
    const index = this.form.get('smsOnNewOrder')?.value?.indexOf(phone);

    if (index >= 0) {
      this.form.get('smsOnNewOrder')?.value.splice(index, 1);
    }
    this.form.markAsDirty();
  }
}

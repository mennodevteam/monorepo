import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { MatDialog } from '@angular/material/dialog';
import { FilesService } from '../../../core/services/files.service';
import { PersianNumberService } from '@menno/utils';
import { MatomoService } from '../../../core/services/matomo.service';
import { MenuService } from '../../../core/services/menu.service';

@Component({
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
    private dialog: MatDialog,
    private fileService: FilesService,
    private matomo: MatomoService,
  ) {
    this.load();
  }

  async load() {
    this.loading = true;
    await this.shopService.loadShop();
    this.form = new FormGroup({
      disableOrdering: new FormControl(this.appConfig.disableOrdering),
      disablePayment: new FormControl(this.appConfig.disablePayment),
      disableOrderingText: new FormControl(this.appConfig.disableOrderingText),
      orderingTypes: new FormControl(this.appConfig.orderingTypes),
      selectableOrderTypes: new FormControl(this.appConfig.selectableOrderTypes),
      requiredPayment: new FormControl(this.appConfig.requiredPayment),
      requiredRegister: new FormControl(this.appConfig.requiredRegister),
      menuViewType: new FormControl(this.appConfig.menuViewType),
      disableOrderingOnClose: new FormControl(this.appConfig.disableOrderingOnClose),
      ding: new FormControl(this.appConfig.ding),
      dings: new FormControl(this.appConfig.dings || []),
      smsOnNewOrder: new FormControl(this.appConfig?.smsOnNewOrder || []),
    });
    this.loading = false;
  }

  get appConfig() {
    return this.shopService.shop!.appConfig!;
  }

  async save() {
    const fv = this.form.getRawValue();
    if (this.form.invalid) return;
    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.http.post('appConfigs', fv).toPromise();
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.saving = false;
    this.form.markAsUntouched();
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

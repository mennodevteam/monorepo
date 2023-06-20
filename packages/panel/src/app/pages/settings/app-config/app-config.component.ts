import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MenuViewType, OrderType, Theme, ThemeMode } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.scss'],
})
export class AppConfigComponent {
  form: FormGroup;
  themes: Theme[] = [];
  saving = false;
  ThemeMode = ThemeMode;
  MenuViewType = MenuViewType;
  OrderType = OrderType;
  readonly separatorKeysCodes = [ENTER] as const;

  constructor(
    private shopService: ShopService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    this.form = new FormGroup({
      theme: new FormControl(this.appConfig.theme),
      themeMode: new FormControl(this.appConfig.themeMode),
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
      menuCols: new FormControl(this.appConfig.menuCols, [Validators.min(2), Validators.max(4)]),
    });

    this.http.get<Theme[]>('appConfigs/themes').subscribe((themes) => {
      this.themes = themes;
      const themeControl = this.form.get('theme');
      themeControl?.setValue(this.themes.find((x) => x.id === themeControl.value.id));
    });
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
}

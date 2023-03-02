import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MenuViewType, OrderType, Theme, ThemeMode } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';

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
      disableOrderingText: new FormControl(this.appConfig.disableOrderingText),
      selectableOrderTypes: new FormControl(this.appConfig.selectableOrderTypes),
      requiredPayment: new FormControl(this.appConfig.requiredPayment),
      requiredRegister: new FormControl(this.appConfig.requiredRegister),
      menuViewType: new FormControl(this.appConfig.menuViewType),
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
}

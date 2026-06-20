import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Shop, ThemeMode, AppConfig } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { environment } from '../../../environments/environment';

import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRadioModule } from '@angular/material/radio';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.scss'],
  imports: [SHARED, MatCardModule, MatToolbarModule, ReactiveFormsModule, MatRadioModule],
})
export class AppConfigComponent implements FormComponent {
  public readonly shopService = inject(ShopService);
  public readonly snack = inject(MatSnackBar);
  public readonly t = inject(TranslateService);
  
  form = new FormGroup({
    themeHex: new FormControl(this.appConfig.themeHex),
    themeMode: new FormControl(this.appConfig.themeMode),
  });
  ThemeMode = ThemeMode;

  get selectedColor(): string {
    return this.form.get('themeHex')?.value || '#000000';
  }

  openApp() {
    const shop = this.shopService.data();
    if (shop) window.open(Shop.appLink(shop, environment.appDomain), shop.title, 'width=400,height=700');
  }

  get appConfig(): AppConfig {
    const data = this.shopService.data();
    if (!data || !data.appConfig) {
      throw new Error('Shop appConfig is not loaded');
    }
    return data.appConfig;
  }

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
}

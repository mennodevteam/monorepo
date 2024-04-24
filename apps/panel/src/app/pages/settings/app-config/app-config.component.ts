import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HomePage, MenuViewType, OrderType, Shop, Theme, ThemeMode } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { MatDialog } from '@angular/material/dialog';
import { ImageCropperDialogComponent } from '../../../shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { CropperOptions } from 'ngx-image-cropper';
import { FilesService } from '../../../core/services/files.service';
import { PersianNumberService } from '@menno/utils';
import { MatomoService } from '../../../core/services/matomo.service';

@Component({
  selector: 'app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.scss'],
})
export class AppConfigComponent {
  form: FormGroup = new FormGroup({});
  themes: Theme[] = [];
  saving = false;
  loading = true;
  ThemeMode = ThemeMode;
  MenuViewType = MenuViewType;
  HomePage = HomePage;
  savingCover: boolean;
  OrderType = OrderType;
  readonly separatorKeysCodes = [ENTER] as const;

  constructor(
    private shopService: ShopService,
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
      homePage: new FormControl(this.appConfig.homePage),
      disableOrderingOnClose: new FormControl(this.appConfig.disableOrderingOnClose),
      ding: new FormControl(this.appConfig.ding),
      dings: new FormControl(this.appConfig.dings || []),
      menuCols: new FormControl(this.appConfig.menuCols, [Validators.min(2), Validators.max(4)]),
      smsOnNewOrder: new FormControl(this.appConfig?.smsOnNewOrder || [])
    });

    this.http.get<Theme[]>('appConfigs/themes').subscribe((themes) => {
      this.themes = themes;
      const themeControl = this.form.get('theme');
      themeControl?.setValue(this.themes.find((x) => x.id === themeControl.value?.id));
      this.loading = false;
      this.form.valueChanges.subscribe(() => {
        this.form.markAsDirty();
      });
    });
  }

  openApp() {
    window.open(this.shopService.appLink, this.shopService.shop?.title, 'width=400,height=700');
  }

  upload() {
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: <CropperOptions>{
          resizeToWidth: 800,
          aspectRatio: 390 / 844,
        },
      })
      .afterClosed()
      .subscribe(async (data) => {
        if (data) {
          this.savingCover = true;
          this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
          const savedFile = await this.fileService.upload(data.file, `cover.jpg`);
          if (savedFile?.key) {
            await this.shopService.saveShop({
              verticalCover: savedFile.key,
            } as Shop);
            this.shopService.shop!.verticalCover = savedFile.key;
            this.snack.open(this.translate.instant('appConfig.coverSaved'), '', {
              panelClass: 'success',
              duration: 1000,
            });
          }
          this.savingCover = false;
        }
      });
  }

  get appConfig() {
    return this.shopService.shop!.appConfig!;
  }

  async save() {
    const fv = this.form.getRawValue();
    if (this.form.invalid) return;
    if (fv.homePage === HomePage.Welcome && !this.shopService.shop?.verticalCover) {
      this.snack.open(this.translate.instant('appConfig.noCoverError'), '', {
        duration: 4000,
        panelClass: 'warning',
      });
      return;
    }
    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.http.post('appConfigs', fv).toPromise();
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.saving = false;
    this.form.markAsUntouched();

    this.matomo.trackEvent('setting', 'app config', 'save changes');

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

import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HomePage, MenuViewType, OrderType, Shop, Theme, ThemeMode } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../core/services/shop.service';
import { ENTER } from '@angular/cdk/keycodes';
import { MatDialog } from '@angular/material/dialog';
import { ImageCropperDialogComponent } from '../../../shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { CropperOptions } from 'ngx-image-cropper';
import { FilesService } from '../../../core/services/files.service';
import { MatomoService } from '../../../core/services/matomo.service';
import { MenuService } from '../../../core/services/menu.service';

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
      theme: new FormControl(this.appConfig.theme),
      themeMode: new FormControl(this.appConfig.themeMode),
      menuViewType: new FormControl(this.appConfig.menuViewType),
      homePage: new FormControl(this.appConfig.homePage),
      menuCols: new FormControl(this.appConfig.menuCols, [Validators.min(2), Validators.max(4)]),
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

  uploadVertical() {
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: <CropperOptions>{
          resizeToWidth: 800,
          aspectRatio: 390 / 840,
        },
      })
      .afterClosed()
      .subscribe(async (data) => {
        if (data) {
          this.savingCover = true;
          this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
          const savedFile = await this.fileService.upload(data.file, 'hr-cover');
          if (savedFile?.key) {
            const imageFile = await this.fileService.saveFileImage(savedFile.key, 'hr-cover');
            await this.shopService.saveShop({
              verticalCover: savedFile.key,
              verticalCoverImage: imageFile,
            } as Shop);
            this.shopService.shop!.verticalCover = savedFile.key;
            if (imageFile) this.shopService.shop!.verticalCoverImage = imageFile;
            this.snack.open(this.translate.instant('appConfig.coverSaved'), '', {
              panelClass: 'success',
              duration: 1000,
            });
          }
          this.savingCover = false;
        }
      });
  }

  uploadHorizontal() {
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: <CropperOptions>{
          resizeToWidth: 800,
          aspectRatio: 390 / 190,
        },
      })
      .afterClosed()
      .subscribe(async (data) => {
        if (data) {
          this.savingCover = true;
          this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
          const savedFile = await this.fileService.upload(data.file, 'cover');
          if (savedFile?.key) {
            const imageFile = await this.fileService.saveFileImage(savedFile.key, 'cover');
            await this.shopService.saveShop({
              cover: savedFile.key,
              coverImage: imageFile,
            } as Shop);
            this.shopService.shop!.cover = savedFile.key;
            if (imageFile) this.shopService.shop!.coverImage = imageFile;
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
}

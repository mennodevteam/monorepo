import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomePage, MenuViewType, OrderType, Shop, ThemeMode } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRadioModule } from '@angular/material/radio';
import { DialogService } from '../../core/services/dialog.service';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { FilesService } from '../../core/services/files.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.scss'],
  imports: [CommonModule, SHARED, MatCardModule, MatToolbarModule, ReactiveFormsModule, MatRadioModule],
})
export class AppConfigComponent implements FormComponent {
  public readonly shopService = inject(ShopService);
  public readonly dialog = inject(DialogService);
  public readonly fileService = inject(FilesService);
  public readonly snack = inject(MatSnackBar);
  public readonly t = inject(TranslateService);
  form = new FormGroup({
    themeHex: new FormControl(this.appConfig.themeHex),
    themeMode: new FormControl(this.appConfig.themeMode),
    menuViewType: new FormControl(this.appConfig.menuViewType),
    homePage: new FormControl(this.appConfig.homePage),
    menuCols: new FormControl(this.appConfig.menuCols, [Validators.min(2), Validators.max(4)]),
    shop: new FormGroup({
      coverImage: new FormControl(this.shopService.data()?.coverImage as any),
      verticalCoverImage: new FormControl(this.shopService.data()?.verticalCoverImage as any),
    }),
  });
  HomePage = HomePage;
  OrderType = OrderType;
  ThemeMode = ThemeMode;
  MenuViewType = MenuViewType;

  openApp() {
    const shop = this.shopService.data();
    if (shop) window.open(Shop.appLink(shop, environment.appDomain), shop.title, 'width=400,height=700');
  }

  get appConfig() {
    return this.shopService.data()!.appConfig!;
  }

  uploadCover() {
    this.dialog
      .imageCropper({
        resizeToWidth: 800,
        aspectRatio: 390 / 190,
      })
      .then((res) => {
        if (res) {
          this.form.controls.shop.controls.coverImage.setValue(res);
          this.form.controls.shop.markAsDirty();
        }
      });
  }

  uploadVerticalCover() {
    this.dialog
      .imageCropper({
        resizeToWidth: 800,
        aspectRatio: 390 / 840,
      })
      .then((res) => {
        if (res) {
          this.form.controls.shop.controls.verticalCoverImage.setValue(res);
          this.form.controls.shop.markAsDirty();
        }
      });
  }

  async save() {
    try {
      const hasCoversEdited = this.form.controls.shop.dirty;
      const { shop, ...appConfig } = this.form.getRawValue();
      this.form.markAsPristine();
      if (shop.coverImage.file) {
        const snackRef = this.snack.open(this.t.instant('app.uploading'), '', { duration: 5000 });
        const savedFile = await this.fileService.upload(shop.coverImage.file, 'coverImage');
        if (savedFile) {
          const imageFile = await this.fileService.saveFileImage(savedFile.key, 'coverImage');
          shop.coverImage = imageFile;
        }
        snackRef.dismiss();
      }
      if (shop.verticalCoverImage.file) {
        const snackRef = this.snack.open(this.t.instant('app.uploading'), '', { duration: 5000 });
        const savedFile = await this.fileService.upload(shop.verticalCoverImage.file, 'verticalCoverImage');
        if (savedFile) {
          const imageFile = await this.fileService.saveFileImage(savedFile.key, 'verticalCoverImage');
          shop.verticalCoverImage = imageFile;
        }
        snackRef.dismiss();
      }
      await this.shopService.saveAppConfigMutation.mutateAsync({
        appConfig: appConfig as any,
        shop: hasCoversEdited ? shop : null,
      });
    } catch (error) {
      this.form.markAsDirty();
    }
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}

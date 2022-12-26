import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Region, Shop } from '@menno/types';
import { COMMA, ENTER, P } from '@angular/cdk/keycodes';
import { CropperOptions } from 'ngx-image-cropper';
import { ShopService } from '../../../core/services/shop.service';
import { FieldSection } from '../../../shared/components/form-builder/form-builder.component';
import { ImageCropperDialogComponent } from '../../../shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FilesService } from '../../../core/services/files.service';
import { TranslateService } from '@ngx-translate/core';
import { RegionsService } from '../../../core/services/regions.service';
import { filter } from 'rxjs';

@Component({
  selector: 'shop-page',
  templateUrl: './shop-page.component.html',
  styleUrls: ['./shop-page.component.scss'],
})
export class ShopPageComponent implements OnInit {
  form: FormGroup;
  imageCropperResult?: { base64: string; file: File };
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formBuilderData: FieldSection[];
  saving = false;

  constructor(
    private shopService: ShopService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private fileService: FilesService,
    private translate: TranslateService,
    private regionsService: RegionsService
  ) {
    const shop = this.shopService.shop;

    this.form = this.fb.group({
      title: [shop?.title, Validators.required],
      description: [shop?.description],
      instagram: [shop?.instagram],
      phones: [shop?.phones || []],
      address: [shop?.address],
      region: [shop?.region],
      latitude: [shop?.latitude],
      longitude: [shop?.longitude],
      logo: [shop?.logo],
    });

    this.regionsService.regionsObservable
      .pipe(filter((x) => x != undefined))
      .subscribe((regions) => {
        if (shop?.region) {
          this.form.get('region')?.setValue(regions?.find((x) => x.id === shop.region.id));
        }
      });
  }

  ngOnInit(): void {}

  addPhone(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.form.get('phones')?.value.push(value);
    }
    event.chipInput!.clear();
    this.form.markAsDirty();
  }

  removePhone(phone: string): void {
    const index = this.form.get('phones')?.value?.indexOf(phone);

    if (index >= 0) {
      this.form.get('phones')?.value.splice(index, 1);
    }
    this.form.markAsDirty();
  }

  upload() {
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: <CropperOptions>{
          resizeToWidth: 512,
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.imageCropperResult = data;
          this.form.markAsDirty();
        }
      });
  }

  removePhoto() {}

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.getRawValue();
    if (this.imageCropperResult) {
      this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
      const savedFile = await this.fileService.upload(
        this.imageCropperResult.file,
        `${dto.title}.jpeg`
      );
      dto.logo = savedFile?.key;
    }
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.shopService.saveShop(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.saving = false;
  }

  get regions() {
    return this.regionsService.regions;
  }
}

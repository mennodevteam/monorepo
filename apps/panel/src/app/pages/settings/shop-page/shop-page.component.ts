import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { BusinessCategory, Region, Shop } from '@menno/types';
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
import * as L from 'leaflet';
import { OpeningHoursDialogComponent } from './opening-hours-dialog/opening-hours-dialog.component';
import { MatomoService } from '../../../core/services/matomo.service';

@Component({
  selector: 'shop-page',
  templateUrl: './shop-page.component.html',
  styleUrls: ['./shop-page.component.scss'],
})
export class ShopPageComponent implements OnInit {
  form: FormGroup;
  categories = Object.values(BusinessCategory);
  imageCropperResult?: { base64: string; file: File };
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formBuilderData: FieldSection[];
  saving = false;
  mapEdit = false;
  mapOptions: L.MapOptions = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom:
      this.shop?.latitude && this.shop.longitude
        ? 16
        : this.shop?.region?.latitude && this.shop.region?.longitude
          ? 13
          : 6,
    center:
      this.shop?.latitude && this.shop.longitude
        ? L.latLng(this.shop.latitude, this.shop.longitude)
        : this.shop?.region?.latitude && this.shop.region?.longitude
          ? L.latLng(this.shop?.region?.latitude, this.shop.region?.longitude)
          : L.latLng(32.723, 53.682),
  };
  marker: L.Marker;

  map: L.Map;

  constructor(
    private shopService: ShopService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private fileService: FilesService,
    private translate: TranslateService,
    private regionsService: RegionsService,
    private matomo: MatomoService,
  ) {
    const shop = this.shopService.shop;

    if (shop?.latitude && shop.longitude) this.marker = new L.Marker(L.latLng(shop.latitude, shop.longitude));

    this.form = this.fb.group({
      title: [shop?.title, Validators.required],
      businessCategory: [shop?.businessCategory, Validators.required],
      description: [shop?.description],
      instagram: [shop?.instagram],
      phones: [shop?.phones || []],
      address: [shop?.address],
      region: [shop?.region],
      latitude: [shop?.latitude],
      longitude: [shop?.longitude],
      logo: [shop?.logo],
    });

    this.regionsService.regionsObservable.pipe(filter((x) => x != undefined)).subscribe((regions) => {
      if (shop?.region) {
        this.form.get('region')?.setValue(regions?.find((x) => x.id === shop.region.id));
      }
      this.form.get('region')?.valueChanges.subscribe((r) => {
        if (r?.latitude && r?.longitude && this.map) {
          this.map.flyTo([r.latitude, r.longitude], 13);
        }
      });
    });
  }

  ngOnInit(): void {}

  mapClick(ev: L.LeafletMouseEvent) {
    if (this.mapEdit) {
      this.form.get('latitude')?.setValue(ev.latlng.lat);
      this.form.get('longitude')?.setValue(ev.latlng.lng);
      this.map.flyTo(ev.latlng, 16);
      this.form.markAsDirty();
      if (!this.marker) this.marker = new L.Marker(ev.latlng);
      else this.marker.setLatLng(ev.latlng);
      this.mapEdit = false;
    }
  }

  mapReady(ev: L.Map) {
    this.map = ev;
  }

  get shop() {
    return this.shopService.shop;
  }

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
          format: 'png',
        },
      })
      .afterClosed()
      .subscribe((data) => {
        if (data) {
          this.imageCropperResult = data;
          this.form.markAsDirty();
        }

        this.matomo.trackEvent('setting', 'shop', 'upload logo', data != undefined);
      });
  }

  openOpeningHoursDialog() {
    this.matomo.trackEvent('settings', 'shop', 'opening hour click');

    this.dialog.open(OpeningHoursDialogComponent, {
      disableClose: true,
      width: '420px',
    });
  }

  removePhoto() {
    this.form.get('logo')?.setValue(null);
    this.form.markAsDirty();
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.getRawValue();
    if (this.imageCropperResult) {
      this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
      const savedFile = await this.fileService.upload(this.imageCropperResult.file, `logo`);
      if (savedFile) {
        const imageFile = await this.fileService.saveFileImage(savedFile.key, 'logo');
        dto.logoImage = imageFile;
      }
      dto.logo = savedFile?.key;
    }
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.shopService.saveShop(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });

    this.matomo.trackEvent('settings', 'shop', 'save changes');

    this.saving = false;
  }

  get regions() {
    return this.regionsService.regions;
  }
}

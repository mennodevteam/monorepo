import { PlatformLocation } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { OrderType, Product, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { FilesService } from '../../../core/services/files.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { ImageCropperDialogComponent } from '../../../shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { DomSanitizer } from '@angular/platform-browser';
import { CropperOptions } from 'ngx-image-cropper';

@Component({
  selector: 'product-edit-page',
  templateUrl: './product-edit-page.component.html',
  styleUrls: ['./product-edit-page.component.scss'],
})
export class ProductEditPageComponent {
  form: FormGroup;
  Status = Status;
  OrderType = OrderType;
  saving = false;
  imageCropperResult?: { base64: string; file: File };
  product?: Product;

  constructor(
    private shopService: ShopService,
    private menuService: MenuService,
    private location: PlatformLocation,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private fileService: FilesService,
    private sanitizer: DomSanitizer
  ) {
    this.form = new FormGroup({
      title: new FormControl('', Validators.required),
      category: new FormControl(undefined, Validators.required),
      description: new FormControl(''),
      price: new FormControl(undefined, Validators.required),
      status: new FormControl(Status.Active, Validators.required),
      orderTypes: new FormControl(
        [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
        Validators.required
      ),
      images: new FormControl([]),
      spans: new FormControl([1, 1], Validators.required),
      hideTitle: new FormControl(false),
      hidePrice: new FormControl(false),
    });

    this.route.queryParams.subscribe(async (params) => {
      const categories = this.menuService?.menu?.categories;
      if (params['id']) {
        this.product = this.menuService.getProductById(params['id']);
        if (this.product) {
          this.form.setValue({
            title: this.product.title,
            category: categories?.find((x) => x.id === this.product?.category.id),
            description: this.product.description,
            price: this.product.price,
            status: this.product.status,
            orderTypes: this.product.orderTypes,
            images: this.product.images,
            hideTitle: this.product.details?.hideTitle || false,
            hidePrice: this.product.details?.hidePrice || false,
            spans: this.product.details
              ? [this.product.details.colspan || 1, this.product.details.rowspan || 1]
              : [1, 1],
          });
        }
      }

      if (params['categoryId'] && categories)
        this.form
          .get('category')
          ?.setValue(categories?.find((x) => x.id.toString() === params['categoryId']));
    });
  }

  get statusControl() {
    return this.form.get('status') as FormControl;
  }

  get orderTypesControl() {
    return this.form.get('orderTypes') as FormControl;
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.getRawValue();
    if (this.product) dto.id = this.product.id;
    if (this.imageCropperResult) {
      this.snack.open(this.translate.instant('app.uploading'), '', { duration: 5000 });
      const savedFile = await this.fileService.upload(this.imageCropperResult.file, `${Date.now()}.jpeg`);
      dto.images = [savedFile?.key];
    }
    dto.details = {
      colspan: dto.spans[0],
      rowspan: dto.spans[1],
      hideTitle: dto.hideTitle,
      hidePrice: dto.hidePrice,
    };
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.menuService.saveProduct(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.saving = false;
    this.location.back();
  }

  setSpan(val: [number, number]) {
    this.form.get('spans')?.setValue(val);
    this.form.markAsDirty();
  }

  upload() {
    const spans = this.form.get('spans')?.value;
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: {
          resizeToWidth: 600,
          imageQuality: 90,
          aspectRatio: spans ? spans[0] / spans[1] : 1,
        } as CropperOptions,
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
}

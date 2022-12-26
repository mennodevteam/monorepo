import { PlatformLocation } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MenuCost, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from 'packages/panel/src/app/core/services/menu.service';

@Component({
  selector: 'edit-discount',
  templateUrl: './edit-discount.component.html',
  styleUrls: ['./edit-discount.component.scss'],
})
export class EditDiscountComponent {
  form: FormGroup;
  Status = Status;
  // OrderType = OrderType;
  saving = false;
  discount?: MenuCost;

  constructor(
    private menuService: MenuService,
    private location: PlatformLocation,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    this.form = new FormGroup({
      title: new FormControl('', Validators.required),
      description: new FormControl(''),
      percentageCost: new FormControl(0),
      fixedCost: new FormControl(0),
      status: new FormControl(Status.Active, Validators.required),
      fromDate: new FormControl(),
      toDate: new FormControl(),
      includeProductCategory: new FormControl([]),
      includeProduct: new FormControl([]),
      _type: new FormControl('all', Validators.required),
    });

    // this.route.queryParams.subscribe(async (params) => {
    //   const categories = this.menuService?.menu?.categories;
    //   if (params['id']) {
    //     this.product = this.menuService.getProductById(params['id']);
    //     if (this.product) {
    //       this.form.setValue({
    //         title: this.product.title,
    //         category: categories?.find((x) => x.id === this.product?.category.id),
    //         description: this.product.description,
    //         price: this.product.price,
    //         status: this.product.status,
    //         orderTypes: this.product.orderTypes,
    //         images: this.product.images,
    //       });
    //     }
    //   }

    //   if (params['categoryId'] && categories)
    //     this.form
    //       .get('category')
    //       ?.setValue(categories?.find((x) => x.id.toString() === params['categoryId']));
    // });
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  async save() {
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    if (!dto.fixedCost && !dto.percentageCost) {
      this.snack.open(this.translate.instant('discountEdit.priceWarning'), '', { duration: 4000, panelClass: 'warning' });
      return;
    }

    if (dto._type === 'all') dto.includeProduct = dto.includeProductCategory = [];
    else if (dto._type === 'category') dto.includeProduct = [];
    else if (dto._type === 'product') dto.includeProductCategory = [];

    this.snack.open(this.translate.instant('app.saving'), '', { duration: 8000 });
    if (dto.fixedCost) dto.fixedCost = Math.abs(dto.fixedCost) * -1;
    if (dto.percentageCost) dto.percentageCost = Math.abs(dto.percentageCost) * -1;
    this.menuService.saveMenuCost(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 3000, panelClass: 'success' });
    this.location.back();
  }

  cv(key: string) {
    return this.form.get(key)?.value;
  }

  clearDate() {
    this.form.get('fromDate')?.setValue(null);
    this.form.get('toDate')?.setValue(null);
  }
}

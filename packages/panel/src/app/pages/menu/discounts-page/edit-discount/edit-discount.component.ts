import { PlatformLocation } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MenuCost, OrderType, Status } from '@menno/types';
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
      orderTypes: new FormControl([OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway]),
      status: new FormControl(Status.Active, Validators.required),
      includeProductCategory: new FormControl([]),
      includeProduct: new FormControl([]),
    });

    this.route.queryParams.subscribe(async (params) => {
      if (params['id']) {
        this.discount = this.menuService.menu?.costs.find((x) => x.id.toString() === params['id']);
        if (this.discount) {
          const d = this.discount;
          this.form.setValue({
            title: d.title,
            description: d.description,
            percentageCost: d.percentageCost ? Math.abs(d.percentageCost) : 0,
            fixedCost: d.fixedCost ? Math.abs(d.fixedCost) : 0,
            orderTypes: d.orderTypes,
            status: d.status,
            includeProductCategory: d.includeProductCategory
              ? this.menuService.filterCategoriesByIds(d.includeProductCategory.map((x) => x.id))
              : [],
            includeProduct: d.includeProduct
              ? this.menuService.filterProductsByIds(d.includeProduct.map((x) => x.id))
              : [],
          });
        }
      }
    });
  }

  get orderTypesControl() {
    return this.form.get('orderTypes') as FormControl;
  }

  get statusControl() {
    return this.form.get('status') as FormControl;
  }

  get includeProductControl() {
    return this.form.get('includeProduct') as FormControl;
  }

  get includeProductCategoryControl() {
    return this.form.get('includeProductCategory') as FormControl;
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  async save() {
    if (this.form.invalid) return;
    const dto = this.form.getRawValue();
    if (!dto.fixedCost && !dto.percentageCost) {
      this.snack.open(this.translate.instant('discountEdit.priceWarning'), '', {
        duration: 4000,
        panelClass: 'warning',
      });
      return;
    }

    this.snack.open(this.translate.instant('app.saving'), '', { duration: 8000 });
    if (dto.fixedCost) dto.fixedCost = Math.abs(dto.fixedCost) * -1;
    if (dto.percentageCost) dto.percentageCost = Math.abs(dto.percentageCost) * -1;
    if (this.discount) dto.id = this.discount.id;
    await this.menuService.saveMenuCost(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 3000,
      panelClass: 'success',
    });
    this.location.back();
  }

  cv(key: string) {
    return this.form.get(key)?.value;
  }
}

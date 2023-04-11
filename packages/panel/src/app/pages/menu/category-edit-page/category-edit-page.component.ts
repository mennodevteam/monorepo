import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OrderType, ProductCategory, Status } from '@menno/types';
import { MenuService } from '../../../core/services/menu.service';
import { PlatformLocation } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { CATEGORY_ICONS } from './category-icons.constant';

@Component({
  selector: 'category-edit-page',
  templateUrl: './category-edit-page.component.html',
  styleUrls: ['./category-edit-page.component.scss'],
})
export class CategoryEditPageComponent {
  icons = CATEGORY_ICONS;
  form: FormGroup;
  Status = Status;
  OrderType = OrderType;
  saving = false;
  category?: ProductCategory;

  constructor(
    private menuService: MenuService,
    private location: PlatformLocation,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    this.form = new FormGroup({
      title: new FormControl('', Validators.required),
      faIcon: new FormControl(''),
      description: new FormControl(''),
      status: new FormControl(Status.Active, Validators.required),
      orderTypes: new FormControl(
        [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway],
        Validators.required
      ),
    });

    this.route.queryParams.subscribe(async (params) => {
      const categories = this.menuService?.menu?.categories;
      if (params['id']) {
        this.category = this.menuService.getCategoryById(Number(params['id']));
        if (this.category) {
          this.form.setValue({
            title: this.category.title,
            faIcon: this.category.faIcon,
            description: this.category.description,
            status: this.category.status,
            orderTypes: this.category.orderTypes,
          });
        }
      }
    });
  }

  get statusControl() {
    return this.form.get('status') as FormControl;
  }

  get orderTypesControl() {
    return this.form.get('orderTypes') as FormControl;
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.getRawValue();
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 5000 });
    await this.menuService.saveCategory(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.saving = false;
    this.location.back();
  }
}

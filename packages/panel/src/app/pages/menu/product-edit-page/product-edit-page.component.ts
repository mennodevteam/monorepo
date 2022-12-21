import { PlatformLocation } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderType, Status } from '@menno/types';
import { map } from 'rxjs';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';

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

  constructor(
    private shopService: ShopService,
    private menuService: MenuService,
    private location: PlatformLocation,
    private route: ActivatedRoute
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
    });

    this.route.queryParams.subscribe(async (params) => {
      const categories = this.shopService.shopValue?.menu?.categories;
      if (params['categoryId'] && categories)
        this.form
          .get('category')
          ?.setValue(categories?.find((x) => x.id.toString() === params['categoryId']));
    });
  }

  get categories() {
    return this.shopService.shop.pipe(map((x) => x?.menu?.categories));
  }

  async save() {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.getRawValue();
    await this.menuService.saveProduct(dto);
    this.saving = false;
    this.location.back();
  }
}

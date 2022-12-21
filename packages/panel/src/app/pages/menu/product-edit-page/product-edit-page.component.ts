import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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

  constructor(private shopService: ShopService) {
    this.form = new FormGroup({
      title: new FormControl('', Validators.required),
      category: new FormControl(undefined, Validators.required),
      description: new FormControl(''),
      price: new FormControl(undefined, Validators.required),
      status: new FormControl(Status.Active, Validators.required),
      orderTypes: new FormControl([OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway], Validators.required)
    });
  }

  get categories() {
    return this.shopService.shop.pipe(map((x) => x?.menu?.categories));
  }
}

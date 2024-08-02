import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'select-product-card',
  templateUrl: './select-product-card.component.html',
  styleUrls: ['./select-product-card.component.scss'],
})
export class SelectProductCardComponent implements OnChanges {
  @Input() categoryControl: FormControl;
  @Input() productControl: FormControl;
  typeControl: FormControl;

  constructor(private menuService: MenuService) {
    let defaultType = 'all';
    if (this.productControl?.value?.length) defaultType = 'product';
    else if (this.categoryControl?.value?.length) defaultType = 'category';
    this.typeControl = new FormControl(defaultType, Validators.required);

    this.typeControl.valueChanges.subscribe((type) => {
      if (type !== 'product') {
        this.productControl.setValue([]);
      }
      if (type !== 'category') {
        this.categoryControl.setValue([]);
      }
    });

    this.setChanges();
  }

  private setChanges() {
    this.productControl?.valueChanges.subscribe((products) => {
      if (products.length) this.typeControl.setValue('product');
    });

    this.categoryControl?.valueChanges.subscribe((categories) => {
      if (categories.length) this.typeControl.setValue('category');
    });

    if (this.productControl?.value?.length) this.typeControl.setValue('product');
    if (this.categoryControl?.value?.length) this.typeControl.setValue('category');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryControl'] && changes['productControl']) {
      this.setChanges();
    }
  }

  get categories() {
    return this.menuService.categories();
  }
}

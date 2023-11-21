import { Component, Input } from '@angular/core';
import { Product, ProductCategory, ProductVariant, Status } from '@menno/types';
import { BasketService } from '../../../../core/services/basket.service';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'category-card-view',
  templateUrl: './category-card-view.component.html',
  styleUrls: ['./category-card-view.component.scss'],
})
export class CategoryCardViewComponent {
  @Input() category: ProductCategory;
  Product = Product;
  Status = Status;

  constructor(private basket: BasketService, public shopService: ShopService) {}

  plus(product: Product, variant?: ProductVariant, ev?: Event) {
    this.basket.plus(product, variant);
    if (ev) ev.stopPropagation();
  }

  minus(product: Product, variant?: ProductVariant, ev?: Event) {
    this.basket.minus(product, variant);
    if (ev) ev.stopPropagation();
  }
}

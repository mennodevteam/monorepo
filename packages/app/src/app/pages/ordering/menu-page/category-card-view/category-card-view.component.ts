import { Component, Input } from '@angular/core';
import { Product, ProductCategory, Status } from '@menno/types';
import { BasketService } from '../../../../core/services/basket.service';

@Component({
  selector: 'category-card-view',
  templateUrl: './category-card-view.component.html',
  styleUrls: ['./category-card-view.component.scss'],
})
export class CategoryCardViewComponent {
  @Input() category: ProductCategory;
  Product = Product;
  Status = Status;

  constructor(private basket: BasketService) {}
  
  plus(product: Product, ev?: Event) {
    this.basket.plus(product);
    if (ev) ev.stopPropagation();
  }
  
  minus(product: Product, ev?: Event) {
    this.basket.minus(product);
    if (ev) ev.stopPropagation();
  }
}

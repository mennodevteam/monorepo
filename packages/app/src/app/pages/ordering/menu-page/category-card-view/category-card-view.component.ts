import { Component, Input } from '@angular/core';
import { Product, ProductCategory } from '@menno/types';

@Component({
  selector: 'category-card-view',
  templateUrl: './category-card-view.component.html',
  styleUrls: ['./category-card-view.component.scss'],
})
export class CategoryCardViewComponent {
  @Input() category: ProductCategory;
  Product = Product;
}

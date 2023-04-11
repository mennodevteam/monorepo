import { Component, Input } from '@angular/core';
import { Menu, Product, ProductCategory } from '@menno/types';

@Component({
  selector: 'category-compact-view',
  templateUrl: './category-compact-view.component.html',
  styleUrls: ['./category-compact-view.component.scss'],
})
export class CategoryCompactViewComponent {
  @Input() menu?: Menu | null;
  @Input() category: ProductCategory;
  Product = Product;
}

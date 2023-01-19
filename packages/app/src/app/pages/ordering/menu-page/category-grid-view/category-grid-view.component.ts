import { Component, Input } from '@angular/core';
import { Menu, Product, ProductCategory } from '@menno/types';

@Component({
  selector: 'category-grid-view',
  templateUrl: './category-grid-view.component.html',
  styleUrls: ['./category-grid-view.component.scss'],
})
export class CategoryGridViewComponent {
  @Input() menu?: Menu | null;
  @Input() category: ProductCategory;
  Product = Product;

  get menuCols() {
    if (this.menu?.cols && this.menu?.cols > 1 && this.menu?.cols < 5) return this.menu?.cols;
    return 2;
  }
}

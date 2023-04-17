import { Component, Input } from '@angular/core';
import { AppConfig, Menu, Product, ProductCategory, Status } from '@menno/types';

@Component({
  selector: 'category-grid-view',
  templateUrl: './category-grid-view.component.html',
  styleUrls: ['./category-grid-view.component.scss'],
})
export class CategoryGridViewComponent {
  @Input() menu?: Menu | null;
  @Input() appConfig?: AppConfig | null;
  @Input() category: ProductCategory;
  Product = Product;
  Status = Status;

  get menuCols() {
    if (this.appConfig?.menuCols && this.appConfig?.menuCols > 1 && this.appConfig?.menuCols < 5) return this.appConfig?.menuCols;
    return 2;
  }
}

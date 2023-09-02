import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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
  breakpointCols?: number;

  constructor(
    private breakpoint: BreakpointObserver,
  ) {
    this.breakpoint
      .observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((value) => {
        if (value.matches) this.breakpointCols = undefined;
        else this.breakpointCols = 4;
      });
  }

  get menuCols() {
    if (this.breakpointCols) return this.breakpointCols;
    if (this.appConfig?.menuCols && this.appConfig?.menuCols > 1 && this.appConfig?.menuCols < 5) return this.appConfig?.menuCols;
    return 2;
  }
}

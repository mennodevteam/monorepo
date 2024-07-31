import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductCategory } from '@menno/types';
import { COMMON } from '../../../common';
import { MatGridListModule } from '@angular/material/grid-list';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-product-grid-view',
  standalone: true,
  imports: [CommonModule, COMMON, MatGridListModule],
  templateUrl: './product-grid-view.component.html',
  styleUrl: './product-grid-view.component.scss',
})
export class ProductGridViewComponent {
  Product = Product;
  @Input() category: ProductCategory;
  isDesktop = this.breakpoint.isMatched('(min-width: 800px)');

  constructor(private breakpoint: BreakpointObserver) {}
}

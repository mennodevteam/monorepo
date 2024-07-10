import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductCategory } from '@menno/types';
import { MatListModule } from '@angular/material/list'
import { COMMON } from '../../../common';

@Component({
  selector: 'app-product-list-view',
  standalone: true,
  imports: [CommonModule, MatListModule, COMMON],
  templateUrl: './product-list-view.component.html',
  styleUrl: './product-list-view.component.scss',
})
export class ProductListViewComponent {
  Product = Product;
  @Input() category: ProductCategory;
}

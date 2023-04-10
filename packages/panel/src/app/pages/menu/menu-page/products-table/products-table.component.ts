import { Component, Input } from '@angular/core';
import { Product } from '@menno/types';

@Component({
  selector: 'products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
})
export class ProductsTableComponent {
  displayedColumns = ['image', 'title', 'price', 'stock', 'actions'];
  @Input() products: Product[];

  abs = Math.abs;
}

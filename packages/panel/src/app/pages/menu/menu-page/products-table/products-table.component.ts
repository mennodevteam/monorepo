import { Component, Input } from '@angular/core';
import { OrderType, Product, Status } from '@menno/types';

@Component({
  selector: 'products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
})
export class ProductsTableComponent {
  displayedColumns = ['image', 'title', 'price', 'actions'];
  @Input() products: Product[];
  Status = Status;
  OrderType = OrderType;

  abs = Math.abs;
}

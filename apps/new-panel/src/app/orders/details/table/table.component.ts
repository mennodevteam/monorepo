import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '@menno/types';
import { MatTableModule } from '@angular/material/table';
import { SHARED } from '../../../shared';

const COLS = ['index', 'title', 'quantity', 'price', 'total'];

@Component({
  selector: 'app-order-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, SHARED],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OrderItemTableComponent {
  order = input<Order>();
  displayedColumns = COLS;
  items = computed(() => {
    return this.order()?.items || [];
    // return order ? Order.productItems(order) : [];
  });
}

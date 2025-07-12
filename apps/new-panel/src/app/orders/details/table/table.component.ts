import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '@menno/types';
import { MatTableModule } from '@angular/material/table';
import { SHARED } from '../../../shared';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-order-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, SHARED],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OrderItemTableComponent {
  order = input<Order>();
  displayedColumns = computed(() => {
    return this.isSmallScreen() ? ['title', 'quantity', 'price'] : ['index', 'title', 'quantity', 'price', 'total']
  });
  items = computed(() => {
    return this.order()?.items || [];
    // return order ? Order.productItems(order) : [];
  });

  private readonly breakpointObserver = inject(BreakpointObserver);
  isSmallScreen = signal(false);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe((result) => {
      this.isSmallScreen.set(result.matches);
    });
  }
}

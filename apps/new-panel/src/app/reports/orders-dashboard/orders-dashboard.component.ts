import { Component } from '@angular/core';

import { SHARED } from '../../shared';
import { OrderTotalComponent } from './order-total/order-total.component';
import { TopProductsCardComponent } from './top-products-card/top-products-card.component';

@Component({
  selector: 'app-orders-dashboard',
  standalone: true,
  imports: [SHARED, OrderTotalComponent, TopProductsCardComponent],
  templateUrl: './orders-dashboard.component.html',
  styleUrl: './orders-dashboard.component.scss',
})
export class OrdersDashboardComponent {}

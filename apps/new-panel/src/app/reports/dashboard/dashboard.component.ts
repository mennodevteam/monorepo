import { Component } from '@angular/core';

import { SHARED } from '../../shared';
import { OrderTotalComponent } from "./order-total/order-total.component";
import { MenuStatCardComponent } from "./menu-stat-card/menu-stat-card.component";
import { LoadMenuRefCardComponent } from "./load-menu-ref-card/load-menu-ref-card.component";
import { TopProductsCardComponent } from './top-products-card/top-products-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED, OrderTotalComponent, MenuStatCardComponent, LoadMenuRefCardComponent, TopProductsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}

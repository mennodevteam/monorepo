import { Component, inject } from '@angular/core';

import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ShopService } from '../shop/shop.service';
import { ShopInfoCardComponent } from './shop-info-card/shop-info-card.component';
import { PlanCardComponent } from './plan-card/plan-card.component';
import { OrderTotalComponent } from './order-total/order-total.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SHARED, MatToolbarModule, ShopInfoCardComponent, PlanCardComponent, OrderTotalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly shopService = inject(ShopService);
}

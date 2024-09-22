import { Route } from '@angular/router';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderFilterComponent } from './order-filter/order-filter.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { DailyOrdersComponent } from './daily-orders/daily-orders.component';
import { OrderListComponent } from './order-list/order-list.component';
import { inject } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';

export const ordersRoutes: Route[] = [
  { path: 'daily', component: DailyOrdersComponent },
  { path: 'list', component: OrderListComponent },
  { path: 'report', component: OrderReportsComponent },
  { path: 'filter', component: OrderFilterComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const shopService = inject(ShopService);
      if (shopService.isRestaurantOrCoffeeShop) {
        return `daily`;
      } else {
        return `list`;
      }
    },
  },
];

import { Route } from '@angular/router';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderFilterComponent } from './order-filter/order-filter.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { DailyOrdersComponent } from './daily-orders/daily-orders.component';

export const ordersRoutes: Route[] = [
  { path: '', component: DailyOrdersComponent },
  { path: 'report', component: OrderReportsComponent },
  { path: 'filter', component: OrderFilterComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
];

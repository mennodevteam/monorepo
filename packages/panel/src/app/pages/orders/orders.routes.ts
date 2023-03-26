import { Route } from '@angular/router';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { OrdersComponent } from './orders.component';

export const ordersRoutes: Route[] = [
  { path: '', component: OrdersComponent },
  { path: 'report', component: OrderReportsComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
];

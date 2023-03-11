import { Route } from '@angular/router';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrdersComponent } from './orders.component';

export const ordersRoutes: Route[] = [
  { path: '', component: OrdersComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
];

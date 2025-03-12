import { Route } from '@angular/router';
import { DetailsComponent } from './details/details.component';
import { ThanksComponent } from './thanks/thanks.component';
import { OrderListComponent } from './list/order-list.component';
import { loginActivator } from '../core';

export const ordersRoutes: Route[] = [
  { path: 'thanks/:id', component: ThanksComponent, data: { animation: 'thanks' } },
  { path: ':id', component: DetailsComponent },
  { path: '', component: OrderListComponent, canActivate: [loginActivator]},
  { path: 'details/:id', pathMatch: 'full', redirectTo: ':id' },
];

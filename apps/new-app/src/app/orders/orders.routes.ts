import { Route } from '@angular/router';
import { DetailsComponent } from './details/details.component';
import { ThanksComponent } from './thanks/thanks.component';

export const ordersRoutes: Route[] = [
  { path: 'thanks/:id', component: ThanksComponent, data: {animation: 'thanks'} },
  { path: ':id', component: DetailsComponent },
  { path: 'details/:id', pathMatch: 'full', redirectTo: ':id' },
];

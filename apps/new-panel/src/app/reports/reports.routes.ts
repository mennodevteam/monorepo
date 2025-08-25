import { Route } from '@angular/router';
import { AnalyticsDashboardComponent } from './analytics-dashboard/analytics-dashboard.component';
import { OrdersDashboardComponent } from './orders-dashboard/orders-dashboard.component';

export const reportRoutes: Route[] = [
  { path: 'analytics-dashboard', component: AnalyticsDashboardComponent },
  { path: 'orders-dashboard', component: OrdersDashboardComponent },
  { path: '', redirectTo: 'orders-dashboard', pathMatch: 'full' },
];

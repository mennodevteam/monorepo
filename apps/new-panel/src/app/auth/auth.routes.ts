import { Route } from '@angular/router';
import { LoginComponent } from './login.component';

export const authRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

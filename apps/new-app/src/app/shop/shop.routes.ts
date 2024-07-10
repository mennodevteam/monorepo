import { Route } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

export const shopRoutes: Route[] = [
  { path: 'welcome', component: WelcomeComponent },
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
];

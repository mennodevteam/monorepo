import { Route } from '@angular/router';
import { AutoSmsSettingComponent } from './sms/sms.component';

export const settingsRoutes: Route[] = [
  { path: 'sms', component: AutoSmsSettingComponent },
  { path: '', redirectTo: 'sms', pathMatch: 'full' },
];

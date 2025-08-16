import { Route } from '@angular/router';
import { SmsGroupComponent } from './sms-group.component';
import { SmsListComponent } from './sms-list/sms-list.component';

export const smsRoutes: Route[] = [
  {
    path: '',
    component: SmsGroupComponent,
  },
  {
    path: ':id',
    component: SmsListComponent,
  },
];

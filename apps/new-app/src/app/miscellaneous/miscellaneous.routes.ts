import { Route } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy';

export const miscellaneousRoutes: Route[] = [
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
    data: { animation: 'privacyPolicy' },
  },
];

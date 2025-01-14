import { Route } from '@angular/router';
import { ThirdPartiesComponent } from './third-parties.component';
import { SizpayComponent } from './sizpay/sizpay.component';
import { AlopeykComponent } from './alopeyk/alopeyk.component';
import { ZibalComponent } from './zibal/zibal.component';
import { ZarinpalComponent } from './zarinpal/zarinpal.component';
import { BasalamComponent } from './basalam/basalam.component';

export const thirdPartiesRoutes: Route[] = [
  {
    path: '',
    component: ThirdPartiesComponent,
  },
  {
    path: 'sizpay',
    component: SizpayComponent,
  },
  {
    path: 'basalam',
    component: BasalamComponent,
  },
  {
    path: 'zibal',
    component: ZibalComponent,
  },
  {
    path: 'zarinpal',
    component: ZarinpalComponent,
  },
  {
    path: 'alopeyk',
    component: AlopeykComponent,
  },
];

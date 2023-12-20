import { Route } from '@angular/router';
import { ThirdPartiesComponent } from './third-parties.component';
import { HamiComponent } from './hami/hami.component';
import { SizpayComponent } from './sizpay/sizpay.component';
import { AlopeykComponent } from './alopeyk/alopeyk.component';
import { ZibalComponent } from './zibal/zibal.component';
import { ZarinpalComponent } from './zarinpal/zarinpal.component';

export const thirdPartiesRoutes: Route[] = [
  {
    path: '',
    component: ThirdPartiesComponent,
  },
  {
    path: 'hami',
    component: HamiComponent,
  },
  {
    path: 'sizpay',
    component: SizpayComponent,
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

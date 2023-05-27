import { Route } from '@angular/router';
import { ThirdPartiesComponent } from './third-parties.component';
import { HamiComponent } from './hami/hami.component';

export const thirdPartiesRoutes: Route[] = [
  {
    path: '',
    component: ThirdPartiesComponent,
  },
  {
    path: 'hami',
    component: HamiComponent,
  },
];

import { Route } from '@angular/router';
import { MaterialsListComponent } from './materials-list.component';

export const materialsRoutes: Route[] = [
  {
    path: '',
    component: MaterialsListComponent,
  },
];
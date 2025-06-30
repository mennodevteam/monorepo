import { Route } from '@angular/router';
import { MaterialsListComponent } from './materials/materials-list.component';
import { BomListComponent } from './bom-list/bom-list.component';

export const materialsRoutes: Route[] = [
  {
    path: 'materials',
    component: MaterialsListComponent,
  },
  {
    path: 'bom',
    component: BomListComponent,
  },
];
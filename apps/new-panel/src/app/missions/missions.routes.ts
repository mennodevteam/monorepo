import { Route } from '@angular/router';
import { MissionListComponent } from './mission-list/mission-list.component';
import { MissionEditComponent } from './mission-edit/mission-edit.component';

export const missionsRoutes: Route[] = [
  {
    path: '',
    component: MissionListComponent,
  },
  {
    path: 'edit',
    component: MissionEditComponent,
  },
];

import { Route } from '@angular/router';
import { MemberListComponent } from './member-list/member-list.component';

export const clubRoutes: Route[] = [
  {
    path: 'members',
    component: MemberListComponent,
  },
];

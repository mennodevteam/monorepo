import { Route } from '@angular/router';
import { ClubComponent } from './club.component';
import { MemberListComponent } from './member-list/member-list.component';

export const clubRoutes: Route[] = [
  {
    path: '',
    component: ClubComponent,
    children: [
      { path: '', component: MemberListComponent },
    ],
  },
];

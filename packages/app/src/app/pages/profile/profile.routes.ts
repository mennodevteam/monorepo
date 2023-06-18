import { Route } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { AuthGuard } from '../../core/guards/auth.guard';

export const profileRoutes: Route[] = [
  {
    path: '',
    component: ProfileComponent,
  },
];

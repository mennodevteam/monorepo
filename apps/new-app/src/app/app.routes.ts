import { Route } from '@angular/router';
import { AuthGuard } from './common/guards/auth.guard';

export const appRoutes: Route[] = [{ path: '', canActivate: [AuthGuard], children: [] }];

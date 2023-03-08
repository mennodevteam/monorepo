import { Route } from '@angular/router';
import { PosComponent } from './pos.component';

export const posRoutes: Route[] = [{ path: '', component: PosComponent, data: { hideShell: true } }];

import { Route } from '@angular/router';
import { ChatComponent } from './chat.component';

export const chatRoutes: Route[] = [{ path: 'order/:id', component: ChatComponent }];

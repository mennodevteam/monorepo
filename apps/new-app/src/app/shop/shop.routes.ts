import { RedirectCommand, Route, Router } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { inject } from '@angular/core';
import { ShopService } from '../core';
import { HomePage } from '@menno/types';
import { InfoComponent } from './info/info.component';

export const shopRoutes: Route[] = [
  {
    path: '',
    canActivate: [
      async () => {
        const router = inject(Router);

        const shopService = inject(ShopService);
        await shopService.getResolver();

        if (shopService.shop?.appConfig?.homePage === HomePage.Menu) {
          return new RedirectCommand(router.parseUrl('/menu'), { skipLocationChange: true });
        }
        return true;
      },
    ],
    component: WelcomeComponent,
    data: { animation: 'welcome' },
  },
  {
    path: 'info',
    component: InfoComponent,
    data: { animation: 'info' },
  },
];

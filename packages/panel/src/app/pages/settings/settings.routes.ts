import { Route } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { ShopPageComponent } from './shop-page/shop-page.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'shop', component: ShopPageComponent },
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
    ],
  },
];

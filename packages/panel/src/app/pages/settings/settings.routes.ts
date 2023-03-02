import { Route } from '@angular/router';
import { AppConfigComponent } from './app-config/app-config.component';
import { SettingsComponent } from './settings.component';
import { ShopPageComponent } from './shop-page/shop-page.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'shop', component: ShopPageComponent },
      { path: 'app-config', component: AppConfigComponent },
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
    ],
  },
];

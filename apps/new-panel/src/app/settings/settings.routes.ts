import { Route } from '@angular/router';
import { AutoSmsSettingComponent } from './sms/sms.component';
import { SettingsComponent } from './settings.component';
import { thirdPartiesRoutes } from './third-parties/third-parties.routes';
import { ShopComponent } from './shop/shop.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';
import { AppConfigComponent } from './app-config/app-config.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'sms', component: AutoSmsSettingComponent },
      { path: 'third-parties', children: thirdPartiesRoutes },
      { path: 'shop', component: ShopComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'app-config', component: AppConfigComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: '', redirectTo: 'shop', pathMatch: 'full' },
    ],
  },
];

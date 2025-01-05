import { Route } from '@angular/router';
import { AutoSmsSettingComponent } from './sms/sms.component';
import { SettingsComponent } from './settings.component';
import { thirdPartiesRoutes } from './third-parties/third-parties.routes';

export const settingsRoutes: Route[] = [
  { path: 'sms', component: AutoSmsSettingComponent },
  { path: 'third-parties', children: thirdPartiesRoutes },
  { path: '', component: SettingsComponent },
];

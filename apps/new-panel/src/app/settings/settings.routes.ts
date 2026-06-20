import { Route } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { thirdPartiesRoutes } from './third-parties/third-parties.routes';
import { ShopComponent } from './shop/shop.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';
import { AppConfigComponent } from './app-config/app-config.component';
import { OrderConfigComponent } from './order-config/order-config.component';
import { DeliveryAreaComponent } from './delivery-area/delivery-area.component';
import { WelcomeMessageComponent } from './welcome-message/welcome-message.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { WebScriptsComponent } from './web-scripts/web-scripts.component';
import { SettingsHomeComponent } from './settings-home/settings-home.component';
import { DomainSettingComponent } from './domain/domain.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
    children: [
      { path: 'third-parties', children: thirdPartiesRoutes },
      { path: 'shop', component: ShopComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'domain', component: DomainSettingComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'app-config', component: AppConfigComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'order-config', component: OrderConfigComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'welcome-message', component: WelcomeMessageComponent, canDeactivate: [dirtyFormDeactivator] },
      { path: 'delivery-area', component: DeliveryAreaComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'web-scripts', component: WebScriptsComponent },
      { path: '', component: SettingsHomeComponent, pathMatch: 'full' },
    ],
  },
];

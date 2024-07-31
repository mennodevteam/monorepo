import { Route } from '@angular/router';
import { AppConfigComponent } from './app-config/app-config.component';
import { DeliveryAreasPageComponent } from './delivery-areas-page/delivery-areas-page.component';
import { PrinterHelpComponent } from './printers/printer-help/printer-help.component';
import { PrinterListComponent } from './printers/printer-list/printer-list.component';
import { PrintersComponent } from './printers/printers.component';
import { SettingsComponent } from './settings.component';
import { ShopPageComponent } from './shop-page/shop-page.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { QrComponent } from './qr/qr.component';
import { SmsComponent } from './sms/sms.component';
import { OrderConfig } from '@menno/types';
import { OrderConfigComponent } from './order-config/order-config.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
  },
  { path: 'shop', component: ShopPageComponent },
  { path: 'delivery-areas', component: DeliveryAreasPageComponent },
  { path: 'app-config', component: AppConfigComponent },
  { path: 'order-config', component: OrderConfigComponent },
  { path: 'users', component: UserManagementComponent },
  { path: 'qr', component: QrComponent },
  { path: 'sms', component: SmsComponent },
  {
    path: 'third-parties',
    loadChildren: () => import('./third-parties/third-parties.module').then((m) => m.ThirdPartiesModule),
  },
  {
    path: 'printers',
    component: PrintersComponent,
    children: [
      { path: 'list', component: PrinterListComponent },
      { path: 'help', component: PrinterHelpComponent },
      { path: '', redirectTo: 'list', pathMatch: 'full' },
    ],
  },
];

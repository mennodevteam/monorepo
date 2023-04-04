import { Route } from '@angular/router';
import { AppConfigComponent } from './app-config/app-config.component';
import { DeliveryAreasPageComponent } from './delivery-areas-page/delivery-areas-page.component';
import { PrinterHelpComponent } from './printers/printer-help/printer-help.component';
import { PrinterListComponent } from './printers/printer-list/printer-list.component';
import { PrintersComponent } from './printers/printers.component';
import { SettingsComponent } from './settings.component';
import { ShopPageComponent } from './shop-page/shop-page.component';

export const settingsRoutes: Route[] = [
  {
    path: '',
    component: SettingsComponent,
  },
  { path: 'shop', component: ShopPageComponent },
  { path: 'delivery-areas', component: DeliveryAreasPageComponent },
  { path: 'app-config', component: AppConfigComponent },
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

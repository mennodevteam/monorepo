import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopPageComponent } from './shop-page/shop-page.component';
import { SettingsComponent } from './settings.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { settingsRoutes } from './settings.routes';
import { AppConfigComponent } from './app-config/app-config.component';
import { PrintersComponent } from './printers/printers.component';
import { PrinterListComponent } from './printers/printer-list/printer-list.component';
import { PrinterHelpComponent } from './printers/printer-help/printer-help.component';
import { DeliveryAreasPageComponent } from './delivery-areas-page/delivery-areas-page.component';
import { DeliveryMapComponent } from './delivery-areas-page/delivery-map/delivery-map.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';

@NgModule({
  declarations: [
    ShopPageComponent,
    SettingsComponent,
    AppConfigComponent,
    PrintersComponent,
    PrinterListComponent,
    PrinterHelpComponent,
    DeliveryAreasPageComponent,
    DeliveryMapComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(settingsRoutes),
    LeafletModule,
    LeafletDrawModule,
  ],
})
export class SettingsModule {}

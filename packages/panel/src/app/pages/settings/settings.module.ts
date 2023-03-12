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

@NgModule({
  declarations: [
    ShopPageComponent,
    SettingsComponent,
    AppConfigComponent,
    PrintersComponent,
    PrinterListComponent,
    PrinterHelpComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule.forChild(settingsRoutes)],
})
export class SettingsModule {}

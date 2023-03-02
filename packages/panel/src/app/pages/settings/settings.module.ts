import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopPageComponent } from './shop-page/shop-page.component';
import { SettingsComponent } from './settings.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { settingsRoutes } from './settings.routes';
import { AppConfigComponent } from './app-config/app-config.component';

@NgModule({
  declarations: [ShopPageComponent, SettingsComponent, AppConfigComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(settingsRoutes)],
})
export class SettingsModule {}

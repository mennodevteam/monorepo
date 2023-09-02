import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopsComponent } from './shops.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { shopRoutes } from './shops.routes';

@NgModule({
  declarations: [ShopsComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(shopRoutes)],
})
export class ShopsModule {}

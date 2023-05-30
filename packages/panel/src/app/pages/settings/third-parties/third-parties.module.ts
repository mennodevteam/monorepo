import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThirdPartiesComponent } from './third-parties.component';
import { HamiComponent } from './hami/hami.component';
import { RouterModule } from '@angular/router';
import { thirdPartiesRoutes } from './third-parties.routes';
import { SharedModule } from '../../../shared/shared.module';
import { SizpayComponent } from './sizpay/sizpay.component';

@NgModule({
  declarations: [ThirdPartiesComponent, HamiComponent, SizpayComponent],
  imports: [CommonModule, RouterModule.forChild(thirdPartiesRoutes), SharedModule],
})
export class ThirdPartiesModule {}

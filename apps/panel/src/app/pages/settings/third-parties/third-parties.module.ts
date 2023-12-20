import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThirdPartiesComponent } from './third-parties.component';
import { HamiComponent } from './hami/hami.component';
import { RouterModule } from '@angular/router';
import { thirdPartiesRoutes } from './third-parties.routes';
import { SharedModule } from '../../../shared/shared.module';
import { SizpayComponent } from './sizpay/sizpay.component';
import { AlopeykComponent } from './alopeyk/alopeyk.component';
import { ZibalComponent } from './zibal/zibal.component';
import { ZarinpalComponent } from './zarinpal/zarinpal.component';

@NgModule({
  declarations: [
    ThirdPartiesComponent,
    HamiComponent,
    SizpayComponent,
    AlopeykComponent,
    ZibalComponent,
    ZarinpalComponent,
  ],
  imports: [CommonModule, RouterModule.forChild(thirdPartiesRoutes), SharedModule],
})
export class ThirdPartiesModule {}

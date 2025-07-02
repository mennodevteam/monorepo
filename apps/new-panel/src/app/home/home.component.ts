import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ShopService } from '../shop/shop.service';
import { ShopInfoCardComponent } from './shop-info-card/shop-info-card.component';
import { PlanCardComponent } from './plan-card/plan-card.component';
import { SmsAccountCardComponent } from './sms-account-card/sms-account-card.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    ShopInfoCardComponent,
    PlanCardComponent,
    SmsAccountCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly shopService = inject(ShopService);
}

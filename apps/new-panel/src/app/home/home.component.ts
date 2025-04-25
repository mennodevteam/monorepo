import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { ShopService } from '../shop/shop.service';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { PayService } from '../core/services/pay.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule, MatListModule, MatProgressBarModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly shopService = inject(ShopService);
  readonly dialog = inject(DialogService);
  readonly translate = inject(TranslateService);
  readonly payService = inject(PayService);
  avgSmsCharge = 3 * 44;


  plugin = computed(() => {
    return this.shopService.data()?.plugins;
  });

  remainingDays = computed(() => {
    const toDate = new Date(this.plugin()?.expiredAt || 0).valueOf();
    return Math.max(0, (toDate - Date.now()) / 3600000 / 24);
  });

  totalDays = computed(() => {
    const fromDate = new Date(this.plugin()?.renewAt || 0).valueOf();
    const toDate = new Date(this.plugin()?.expiredAt || 0).valueOf();
    return Math.max(0, (toDate - fromDate) / 3600000 / 24);
  });

  async chargeSmsAccount() {
    const dto = await this.dialog.prompt(
      this.translate.instant('home.chargeDialogTitle'),
      {
        amount: {
          type: 'number',
          hint: this.translate.instant('app.currency'),
          label: this.translate.instant('home.chargeDialogLabel'),
          control: new FormControl(undefined, [Validators.required, Validators.min(1000)]),
        }
      }, {
        description: this.translate.instant('home.chargeDialogDescription'),
      }
    )
    if (dto?.amount >= 1000) {
      // this.redirectingChargeSms = true;
      // this.analytics.event('charge sms account go to bank', { eventValue: amount });
      this.payService.redirect('chargeSmsAccount', dto.amount);
    }
  }
}

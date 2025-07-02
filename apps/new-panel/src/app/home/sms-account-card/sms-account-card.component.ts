import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { ShopService } from '../../shop/shop.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { PayService } from '../../core/services/pay.service';

@Component({
  selector: 'app-sms-account-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule],
  templateUrl: './sms-account-card.component.html',
  styleUrl: './sms-account-card.component.scss',
})
export class SmsAccountCardComponent {
  readonly shopService = inject(ShopService);
  readonly dialog = inject(DialogService);
  readonly translate = inject(TranslateService);
  readonly payService = inject(PayService);
  avgSmsCharge = 3 * 44;

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
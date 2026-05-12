import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SHARED } from '../../shared';
import { ShopService } from '../../shop/shop.service';
import { PayService } from '../../core/services/pay.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule, MatTooltipModule],
  templateUrl: './wallet-card.component.html',
  styleUrl: './wallet-card.component.scss',
})
export class WalletCardComponent {
  readonly shopService = inject(ShopService);
  private readonly dialogService = inject(DialogService);
  private readonly payService = inject(PayService);
  private readonly translate = inject(TranslateService);

  walletHelp(): void {
    this.dialogService.alert(
      this.translate.instant('app.help'),
      this.translate.instant('home.plan.chargeDescription'),
      {
        config: {
          data: {
            hideCancel: true,
          },
        },
      },
    );
  }

  async chargeSmsAccount(): Promise<void> {
    const dto = await this.dialogService.prompt(
      this.translate.instant('home.chargeDialogTitle'),
      {
        amount: {
          type: 'number',
          hint: this.translate.instant('app.currency'),
          label: this.translate.instant('home.chargeDialogLabel'),
          control: new FormControl(undefined, [Validators.required, Validators.min(1000)]),
        },
      },
      {
        description: this.translate.instant('home.chargeDialogDescription'),
      },
    );
    if (dto?.amount >= 1000) {
      this.payService.redirect('chargeSmsAccount', dto.amount);
    }
  }
}

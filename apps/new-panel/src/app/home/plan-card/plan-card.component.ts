import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ShopService } from '../../shop/shop.service';
import { BuyDaysDialogComponent } from '../../shared/dialogs/buy-days-dialog/buy-days-dialog.component';
import { PayService } from '../../core/services/pay.service';
import { MatListModule } from '@angular/material/list';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss',
})
export class PlanCardComponent {
  readonly shopService = inject(ShopService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly payService = inject(PayService);
  private readonly translate = inject(TranslateService);
  plugin = computed(() => {
    return this.shopService.data()?.plugins;
  });

  remainingDays = computed(() => {
    const toDate = new Date(this.plugin()?.expiredAt || 0).valueOf();
    return Math.max(0, (toDate - Date.now()) / 3600000 / 24);
  });

  buyPlan(): void {
    const dialogRef = this.dialog.open(BuyDaysDialogComponent, {
      width: '400px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.payService.redirect('buyDays', result.days);
      }
    });
  }

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

  async chargeSmsAccount() {
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
      // this.redirectingChargeSms = true;
      // this.analytics.event('charge sms account go to bank', { eventValue: amount });
      this.payService.redirect('chargeSmsAccount', dto.amount);
    }
  }
}

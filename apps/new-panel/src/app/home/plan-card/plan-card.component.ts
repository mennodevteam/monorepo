import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ShopService } from '../../shop/shop.service';
import { BuyDaysDialogComponent } from '../../shared/dialogs/buy-days-dialog/buy-days-dialog.component';
import { PayService } from '../../core/services/pay.service';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss',
})
export class PlanCardComponent {
  readonly shopService = inject(ShopService);
  private readonly dialog = inject(MatDialog);
  private readonly payService = inject(PayService);
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
}

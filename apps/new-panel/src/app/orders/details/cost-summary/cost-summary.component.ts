import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormControl, FormsModule } from '@angular/forms';
import { Order } from '@menno/types';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatListModule } from '@angular/material/list';
import { DialogService } from '../../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { PromptFields } from '../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { OrdersService } from '../../order.service';

@Component({
  selector: 'app-cost-summary',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDividerModule,
    FormsModule,
    MatListModule,
  ],
  templateUrl: './cost-summary.component.html',
  styleUrl: './cost-summary.component.scss',
})
export class CostSummaryComponent {
  order = input.required<Order>();
  showCostChange = output<boolean>();
  isSmallScreen = signal(false);
  showCost = signal(false);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private orderService = inject(OrdersService);

  private readonly breakpointObserver = inject(BreakpointObserver);

  orderTotalCost = computed(() => {
    const order = this.order();
    if (order && order.materialCost) {
      return order.materialCost + (order.extraCosts || 0) + (order.useWallet || 0);
    }
    return 0;
  });

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe((result) => {
      this.isSmallScreen.set(result.matches);
    });
  }

  onShowCostChange(value: boolean) {
    this.showCost.set(value);
    this.showCostChange.emit(value);
  }

  unknownMaterialCost() {
    this.dialog.alert(
      this.translate.instant('app.unknown'),
      this.translate.instant('order.unknownMaterialCostDescription'),
      {
        config: {
          data: {
            hideCancel: true,
          },
        },
      },
    );
  }

  addExtraCost() {
    const fields: PromptFields = {
      value: {
        label: this.translate.instant('order.price'),
        control: new FormControl(this.order()?.extraCosts || 0),
        type: 'number',
        eng: true,
        ltr: true,
        hint: this.translate.instant('app.currency'),
      },
    };
    this.dialog
      .prompt(this.translate.instant('order.extraCosts'), fields, {
        description: this.translate.instant('order.extraCostsDescription'),
      })
      .then((result) => {
        if (result) {
          this.orderService.setExtraCostsMutation.mutate({
            orderId: this.order()?.id,
            extraCosts: result.value,
          });
        }
      });
  }
}

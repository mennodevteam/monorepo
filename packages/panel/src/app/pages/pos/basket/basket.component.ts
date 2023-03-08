import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { OrderItem } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { fadeInOut } from '../../../core/animations/fade.animation';
import { slideInOut } from '../../../core/animations/slide.animation';
import { PosService } from '../../../core/services/pos.service';
import { ManualDiscountAndCostDialogComponent } from '../../../shared/dialogs/manual-discount-and-cost-dialog/manual-discount-and-cost-dialog.component';
import { PromptDialogComponent } from '../../../shared/dialogs/prompt-dialog/prompt-dialog.component';

@Component({
  selector: 'basket',
  templateUrl: './basket.component.html',
  styleUrls: ['./basket.component.scss'],
  animations: [
    slideInOut(),
    fadeInOut('0.2s 0.5s'),
    trigger('shakeIt', [
      transition('* => *', [
        style({ transform: 'scale(1.5)', opacity: '0' }),
        animate('300ms ease-in', style({ transform: 'scale(1)', opacity: '1' })),
      ]),
    ]),
  ],
})
export class BasketComponent {
  showFactorDetails = false;
  constructor(public POS: PosService, private dialog: MatDialog, private translate: TranslateService) {}

  async openNoteDialog() {
    const note = await this.dialog.open(PromptDialogComponent, {
      data: {
        title: this.translate.instant('pos.noteDialogTitle'),
        label: this.translate.instant('pos.noteDialogLabel'),
        placeholder: this.translate.instant('pos.noteDialogPlaceholder'),
        type: 'textarea',
        rows: 5,
        value: this.POS.note || '',
      },
      width: '400px'
    }).afterClosed().toPromise();
    if (note !== null) {
      this.POS.note = note;
    }
  }

  openDiscountAndCostDialog(price: number, type: 'discount' | 'cost') {
    this.dialog.open(ManualDiscountAndCostDialogComponent, {
      data: {
        totalPrice: (this.POS.total - (this.POS.manualDiscount || 0) - (this.POS.manualCost || 0)),
        sum: this.POS.sum,
        price,
      }
    }).afterClosed().subscribe((val) => {
      if (val != undefined) {
        if (type === 'cost') {
          this.POS.manualCost = val;
        }
        else if (type === 'discount') {
          this.POS.manualDiscount = val;
        }
      }
    });
  }
}

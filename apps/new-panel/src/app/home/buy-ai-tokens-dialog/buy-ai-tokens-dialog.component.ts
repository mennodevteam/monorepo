import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { kUnitsToTokens, PRESET_K_UNITS } from '../ai-tokens';

export type BuyAiTokensDialogData = {
  pricePer1000Toman: number;
  tokensPerK: number;
  minPurchaseK: number;
};

@Component({
  selector: 'app-buy-ai-tokens-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './buy-ai-tokens-dialog.component.html',
  styleUrl: './buy-ai-tokens-dialog.component.scss',
})
export class BuyAiTokensDialogComponent {
  readonly ref = inject(MatDialogRef<BuyAiTokensDialogComponent, number | undefined>);
  readonly data = inject<BuyAiTokensDialogData>(MAT_DIALOG_DATA);

  readonly presetK = [...PRESET_K_UNITS];

  selectedK = 1000;

  get tokenAmount(): number {
    return kUnitsToTokens(this.selectedK);
  }

  get basePriceToman(): number {
    return (this.tokenAmount / 1000) * this.data.pricePer1000Toman;
  }

  get finalPriceToman(): number {
    return Math.floor(this.basePriceToman);
  }

  get canPay(): boolean {
    return this.data.pricePer1000Toman > 0 && this.selectedK >= this.data.minPurchaseK;
  }

  cancel(): void {
    this.ref.close(undefined);
  }

  pay(): void {
    if (!this.canPay) return;
    this.ref.close(this.tokenAmount);
  }
}

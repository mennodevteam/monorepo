import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import { formatTokenIntegerEn, kUnitsToTokens, PRESET_K_UNITS } from '../ai-tokens';

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
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './buy-ai-tokens-dialog.component.html',
  styleUrl: './buy-ai-tokens-dialog.component.scss',
})
export class BuyAiTokensDialogComponent {
  readonly ref = inject(MatDialogRef<BuyAiTokensDialogComponent, number | undefined>);
  readonly data = inject<BuyAiTokensDialogData>(MAT_DIALOG_DATA);

  readonly presetK = [...PRESET_K_UNITS];

  selectedChipK = 1000;
  customKStr = '';

  onPackChange(): void {
    this.customKStr = '';
  }

  get effectiveKUnits(): number {
    const t = this.customKStr.trim();
    if (t !== '') {
      const n = Number(t);
      if (Number.isFinite(n) && n >= this.data.minPurchaseK) {
        return Math.floor(n);
      }
    }
    return this.selectedChipK;
  }

  get effectiveKUnitsEn(): string {
    return this.effectiveKUnits.toLocaleString('en-US', { useGrouping: false });
  }

  get minPurchaseKEn(): string {
    return this.data.minPurchaseK.toLocaleString('en-US', { useGrouping: false });
  }

  get tokenAmount(): number {
    return kUnitsToTokens(this.effectiveKUnits);
  }

  get basePriceToman(): number {
    return (this.tokenAmount / 1000) * this.data.pricePer1000Toman;
  }

  get finalPriceToman(): number {
    return Math.floor(this.basePriceToman);
  }

  get canPay(): boolean {
    return this.data.pricePer1000Toman > 0 && this.effectiveKUnits >= this.data.minPurchaseK;
  }

  formatTokenCountEn(n: number): string {
    return formatTokenIntegerEn(n);
  }

  cancel(): void {
    this.ref.close(undefined);
  }

  pay(): void {
    if (!this.canPay) return;
    this.ref.close(this.tokenAmount);
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { TranslateService } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../shared';
import { ShopService } from '../../shop/shop.service';
import { PayService } from '../../core/services/pay.service';
import { DialogService } from '../../core/services/dialog.service';

type AiTokenPricing = { pricePer1000Toman: number };

@Component({
  selector: 'app-ai-intelligence-card',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: './ai-intelligence-card.component.html',
  styleUrl: './ai-intelligence-card.component.scss',
})
export class AiIntelligenceCardComponent {
  readonly shop = inject(ShopService);
  private readonly http = inject(HttpClient);
  private readonly payService = inject(PayService);
  private readonly dialogService = inject(DialogService);
  private readonly t = inject(TranslateService);

  tokenPricingQuery = injectQuery(() => ({
    queryKey: ['ai-chatbot-token-pricing'],
    queryFn: () => lastValueFrom(this.http.get<AiTokenPricing>('/ai-chatbot/token-pricing')),
  }));

  async buyTokens() {
    if (!this.shop.data()?.aiChatbot) {
      return;
    }
    const pricePer1000 = this.tokenPricingQuery.data()?.pricePer1000Toman ?? 0;
    const feeNote = this.t.instant('aiChatbot.tokensPaymentNote');
    const pricingHint =
      pricePer1000 > 0
        ? this.t.instant('aiChatbot.tokensPriceHint', { price: pricePer1000 })
        : this.t.instant('aiChatbot.tokensPricingNotConfigured');

    const dto = await this.dialogService.prompt(
      this.t.instant('aiChatbot.buyTokensTitle'),
      {
        tokenAmount: {
          type: 'number',
          label: this.t.instant('aiChatbot.buyTokensAmountLabel'),
          hint: this.t.instant('aiChatbot.buyTokensAmountHint'),
          control: new FormControl<number | undefined>(undefined, [Validators.required, Validators.min(1000)]),
        },
      },
      {
        description: [this.t.instant('aiChatbot.tokensUsageDescription'), pricingHint, feeNote].join('\n\n'),
      },
    );

    const amount = dto?.tokenAmount;
    if (typeof amount === 'number' && amount >= 1000) {
      await this.payService.redirect('buyAiChatbotTokens', amount);
    }
  }
}

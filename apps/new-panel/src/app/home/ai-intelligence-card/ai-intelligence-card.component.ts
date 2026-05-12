import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../shared';
import { ShopService } from '../../shop/shop.service';
import { PayService } from '../../core/services/pay.service';
import { formatTokensKLabel } from '../ai-tokens';
import { BuyAiTokensDialogComponent } from '../buy-ai-tokens-dialog/buy-ai-tokens-dialog.component';

type AiTokenPricing = {
  pricePer1000Toman: number;
  tokensPerK: number;
  minPurchaseK: number;
};

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
  private readonly t = inject(TranslateService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  tokenPricingQuery = injectQuery(() => ({
    queryKey: ['ai-chatbot-token-pricing'],
    queryFn: () => lastValueFrom(this.http.get<AiTokenPricing>('/ai-chatbot/token-pricing')),
  }));

  formatTokensK(tokens: number | null | undefined): string {
    return formatTokensKLabel(tokens);
  }

  buyTokens(): void {
    if (!this.shop.data()?.aiChatbot) {
      return;
    }
    const pricing = this.tokenPricingQuery.data();
    if (!pricing?.pricePer1000Toman) {
      this.snack.open(this.t.instant('aiChatbot.tokensPricingNotConfigured'), '', { panelClass: 'error' });
      return;
    }
    this.dialog
      .open(BuyAiTokensDialogComponent, {
        width: '440px',
        data: pricing,
      })
      .afterClosed()
      .subscribe((tokens) => {
        if (typeof tokens === 'number') {
          void this.payService.redirect('buyAiChatbotTokens', tokens);
        }
      });
  }
}

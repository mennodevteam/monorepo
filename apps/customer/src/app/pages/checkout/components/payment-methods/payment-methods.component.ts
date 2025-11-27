import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../../../core/services/cart.service';
import { ClubService } from '../../../../core/services/club.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { OrderPaymentType } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, MatListModule, MatRadioModule, MatCheckboxModule, TranslateModule],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss',
})
export class PaymentMethodsComponent {
  cart = inject(CartService);
  club = inject(ClubService);
  analytics = inject(AnalyticsService);
  shopService = inject(ShopService);

  OrderPaymentType = OrderPaymentType;
  selectedPaymentType: OrderPaymentType = OrderPaymentType.Cash;

  constructor() {
    if (this.cart.paymentType()) {
      this.selectedPaymentType = this.cart.paymentType()!;
    } else {
      // Default logic
      if (this.shopService.isPaymentAvailable()) {
        this.selectedPaymentType = OrderPaymentType.Online;
      } else {
        this.selectedPaymentType = OrderPaymentType.Cash;
      }
      this.cart.paymentType.set(this.selectedPaymentType);
    }
  }

  onPaymentTypeChange(type: OrderPaymentType) {
    this.selectedPaymentType = type;
    this.cart.paymentType.set(type);

    this.analytics.trackEvent('payment_method_selected', {
      paymentMethod: type,
    });
  }

  onWalletChange(checked: boolean) {
    this.cart.useWallet.set(checked);
    if (checked) {
      this.analytics.trackEvent('wallet_used', {
        walletBalance: this.club.wallet?.charge || 0,
      });
    }
  }
}

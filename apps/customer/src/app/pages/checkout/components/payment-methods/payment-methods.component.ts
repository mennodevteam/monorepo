import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CartService } from '../../../../core/services/cart.service';
import { ClubService } from '../../../../core/services/club.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { OrderPaymentType } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatCheckboxModule,
  ],
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

    this.ensureSelectedPaymentTypeIsAvailable();
  }

  get hasOnlinePayment() {
    return this.shopService.isPaymentAvailable();
  }

  get hasCashPayment() {
    return !this.shopService.isPaymentRequired();
  }

  get availablePaymentMethodsCount() {
    return Number(this.hasOnlinePayment) + Number(this.hasCashPayment);
  }

  get singlePaymentMethodDescription() {
    if (this.hasOnlinePayment && !this.hasCashPayment) {
      return 'پرداخت این سفارش فقط به صورت آنلاین امکان‌پذیر است.';
    }

    if (!this.hasOnlinePayment && this.hasCashPayment) {
      return 'پرداخت این سفارش فقط به صورت نقدی امکان‌پذیر است.';
    }

    return '';
  }

  private ensureSelectedPaymentTypeIsAvailable() {
    const onlineSelected = this.selectedPaymentType === OrderPaymentType.Online;
    const cashSelected = this.selectedPaymentType === OrderPaymentType.Cash;

    if (onlineSelected && !this.hasOnlinePayment && this.hasCashPayment) {
      this.onPaymentTypeChange(OrderPaymentType.Cash);
    } else if (cashSelected && !this.hasCashPayment && this.hasOnlinePayment) {
      this.onPaymentTypeChange(OrderPaymentType.Online);
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

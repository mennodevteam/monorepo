import { Component, computed, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../common';
import { InvoiceComponent } from './invoice/invoice.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { CartService } from '../core/services/cart.service';
import { ClubService } from '../core/services/club.service';
import { Router } from '@angular/router';
import { ShopService } from '../core';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, COMMON, InvoiceComponent, PaymentMethodsComponent, TopAppBarComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  saving = signal(false);
  constructor(
    private cart: CartService,
    private club: ClubService,
    private router: Router,
    private location: PlatformLocation,
    private shopService: ShopService,
  ) {
    if (this.cart.length() === 0) {
      this.location.back();
    }
  }

  total = computed(() => {
    if (!this.cart.useWallet()) return this.cart.total();
    else {
      const useWallet = this.club.wallet?.charge || 0;
      console.log(useWallet);
      return Math.max(0, this.cart.total() - useWallet);
    }
  });

  async submit() {
    this.saving.set(true);
    const order = await this.cart.complete();
    if (order) {
      (order.shop = this.shopService.shop),
        this.router.navigate(['/orders', order.id], { replaceUrl: true, state: { order } });
    }
  }
}

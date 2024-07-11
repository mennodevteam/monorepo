import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../common';
import { InvoiceComponent } from "./invoice/invoice.component";
import { PaymentMethodsComponent } from "./payment-methods/payment-methods.component";
import { TopAppBarComponent } from "../common/components/top-app-bar/top-app-bar.component";
import { CartService } from '../core/services/cart.service';
import { ClubService } from '../core/services/club.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, COMMON, InvoiceComponent, PaymentMethodsComponent, TopAppBarComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  constructor(private cart: CartService, private club: ClubService) {}

  total = computed(() => {
    if (!this.cart.useWallet()) return this.cart.total();
    else {
      const useWallet = this.club.wallet?.charge || 0;
      console.log(useWallet);
      return Math.max(0, this.cart.total() - useWallet);
    }
  })
}

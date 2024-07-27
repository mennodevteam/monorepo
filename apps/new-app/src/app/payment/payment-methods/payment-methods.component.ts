import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { MatListModule } from '@angular/material/list';
import { CartService } from '../../core/services/cart.service';
import { FormsModule } from '@angular/forms';
import { OrderPaymentType } from '@menno/types';
import { ClubService } from '../../core/services/club.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule, COMMON, MatListModule, FormsModule],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss',
})
export class PaymentMethodsComponent {
  OrderPaymentType = OrderPaymentType;
  type: OrderPaymentType[] = [OrderPaymentType.Cash];
  useWallet: boolean = this.cart.useWallet();

  constructor(
    public cart: CartService,
    public club: ClubService,
  ) {
    if (this.cart.paymentType() != undefined) this.type = [this.cart.paymentType()!];
    else {
      if (!this.isOnlinePaymentAvailable) this.type = [OrderPaymentType.Cash];
      else if (this.isOnlinePaymentRequired) this.type = [OrderPaymentType.Online];
      if (this.type != undefined) this.cart.paymentType.set(this.type[0]);
    }
  }

  typeSelectionChange(ev: OrderPaymentType[]) {
    this.cart.paymentType.set(ev[0]);
  }

  useWalletSelectedChange(ev: boolean) {
    this.cart.useWallet.set(ev);
  }

  get isOnlinePaymentAvailable() {
    return this.cart.isPaymentAvailable;
  }

  get isOnlinePaymentRequired() {
    return this.cart.isPaymentRequired;
  }
}

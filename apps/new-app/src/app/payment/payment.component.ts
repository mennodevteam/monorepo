import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../common';
import { InvoiceComponent } from './invoice/invoice.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { CartService } from '../core/services/cart.service';
import { ClubService } from '../core/services/club.service';
import { Router } from '@angular/router';
import { AddressesService, MenuService, ShopService } from '../core';
import { MatListModule } from '@angular/material/list';
import { Address, OrderType } from '@menno/types';
import { FormsModule } from '@angular/forms';
import { AddressListComponent } from './address-list/address-list.component';
import { AlertBannerComponent } from '../common/components/alert-banner/alert-banner.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    COMMON,
    InvoiceComponent,
    PaymentMethodsComponent,
    TopAppBarComponent,
    MatListModule,
    FormsModule,
    AddressListComponent,
    AlertBannerComponent,
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  private readonly http = inject(HttpClient);
  OrderType = OrderType;

  vpnQuery = injectQuery(() => ({
    queryKey: ['vpn'],
    queryFn: () => lastValueFrom(this.http.get<{ countryCode: string }>('http://ip-api.com/json/')),
    select: (data) => data.countryCode !== 'IR',
  }));

  constructor(
    public cart: CartService,
    private club: ClubService,
    private router: Router,
    private location: PlatformLocation,
    private shopService: ShopService,
    public addressesService: AddressesService,
    public menu: MenuService,
  ) {
    if (this.cart.length() === 0) {
      this.location.back();
    }
  }

  total = computed(() => {
    if (!this.cart.useWallet()) return this.cart.total();
    else {
      const useWallet = this.club.wallet?.charge || 0;
      return Math.max(0, this.cart.total() - useWallet);
    }
  });

  async submit() {
    const order = await this.cart.complete();
    if (order) {
      (order.shop = this.shopService.shop),
        this.router.navigate(['/orders', order.id], { replaceUrl: true, state: { order } });
    }
  }
}

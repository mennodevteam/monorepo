import { Component, computed, inject } from '@angular/core';
import { PlatformLocation, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxEditOutline,
  saxAddOutline,
} from '@ng-icons/iconsax/outline';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { ShopService } from '../../core/services/shop.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { MenuStatService } from '../../core/services/menu-stat.service';
import { ClubService } from '../../core/services/club.service';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { PaymentMethodsComponent } from './components/payment-methods/payment-methods.component';
import { AddressSelectionDialogComponent } from './components/address-selection-dialog/address-selection-dialog.component';
import { AddressesService } from '../../core/services/addresses.service';
import { StatAction, OrderType } from '@menno/types';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    TopAppBarComponent,
    InvoiceComponent,
    PaymentMethodsComponent,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    NgIcon,
    TranslateModule,
    DecimalPipe,
  ],
  providers: [
    provideIcons({
      saxEditOutline,
      saxAddOutline,
    }),
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  cart = inject(CartService);
  shopService = inject(ShopService);
  analytics = inject(AnalyticsService);
  menuStat = inject(MenuStatService);
  club = inject(ClubService);
  router = inject(Router);
  location = inject(PlatformLocation);
  dialog = inject(MatDialog);
  addressesService = inject(AddressesService);
  OrderType = OrderType;
  editIcon = saxEditOutline;
  addIcon = saxAddOutline;

  constructor() {
    if (this.cart.length() === 0) {
      this.location.back();
    } else {
      this.menuStat.send(StatAction.ViewCheckout, { value: this.cart.total() });
    }
  }

  openAddressDialog() {
    const dialogRef = this.dialog.open(AddressSelectionDialogComponent, {
      width: '90%',
      maxWidth: '500px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addressesService.load(); // Reload addresses
      }
    });
  }

  total = computed(() => {
    if (!this.cart.useWallet()) return this.cart.total();
    else {
      const useWallet = this.club.wallet?.charge || 0;
      return Math.max(0, this.cart.total() - useWallet);
    }
  });

  async submit() {
    // Track order placement attempt
    this.analytics.trackEvent('place_order_attempted', {
      itemCount: this.cart.length(),
      totalAmount: this.total(),
      paymentType: this.cart.paymentType(),
    });

    const order = await this.cart.complete();
    if (order) {
      // Track successful order placement
      this.analytics.trackEvent('order_placed_successfully', {
        orderId: order.id,
        itemCount: this.cart.length(),
        totalAmount: this.total(),
        paymentType: this.cart.paymentType(),
      });

      order.shop = this.shopService.data();
      // Navigate to orders page or success page
      // Assuming orders page for now based on app routes
      this.router.navigate(['/orders'], { replaceUrl: true });
    }
  }
}

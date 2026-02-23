import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { MenuService } from '../../core/services/menu.service';
import { ShopService } from '../../core/services/shop.service';
import { AuthService } from '../../core/services/auth.service';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Product, Menu, StatAction } from '@menno/types';
import { ImageLoaderDirective } from '../../shared/directives';
import { MenuStatService } from '../../core/services/menu-stat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxTrashOutline } from '@ng-icons/iconsax/outline';
import { VpnCheckService } from '../../core/services/vpn-check.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatToolbarModule,
    QuantitySelectorComponent,
    MatButtonModule,
    RouterModule,
    TopAppBarComponent,
    EmptyStateComponent,
    DecimalPipe,
    ImageLoaderDirective,
    NgIcon,
  ],
  providers: [provideIcons({ saxTrashOutline })],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  cart = inject(CartService);
  menuService = inject(MenuService);
  menuStat = inject(MenuStatService);
  shopService = inject(ShopService);
  auth = inject(AuthService);
  router = inject(Router);
  snack = inject(MatSnackBar);
  vpnCheck = inject(VpnCheckService);
  Product = Product;
  trashIcon = saxTrashOutline;

  constructor() {
    if (this.cart.length() > 0) {
      this.menuStat.send(StatAction.ViewCart, { value: this.cart.total() });
    }
  }

  private getMissedProducts(): Product[] {
    const menu = this.menuService.data();
    const orderItems = this.cart.orderItems();
    if (!menu || !orderItems.length) return [];

    const cartProductIds = new Set(orderItems.map((i) => i.product?.id).filter(Boolean));
    const missed = new Map<string, Product>();

    for (const item of orderItems) {
      const product = item.product;
      if (!product?.relatedProductIds?.length) continue;

      for (const relatedId of product.relatedProductIds) {
        if (cartProductIds.has(relatedId)) continue;
        const related = Menu.getProductById(menu, relatedId);
        if (related) missed.set(related.id, related);
      }
    }

    return Array.from(missed.values());
  }

  clearCart() {
    const snapshot = this.cart
      .quantity()
      .map((x) => ({ productId: x.productId, variantId: x.variantId, quantity: x.quantity() }));
    this.cart.clear();
    const ref = this.snack.open('سبد خرید خالی شد.', 'بازگردانی', { duration: 5000 });
    ref.onAction().subscribe(() => {
      this.cart.restoreQuantity(snapshot);
    });
  }

  proceedToCheckout() {
    if (this.shopService.isOrderingTemporaryDisabled) {
      this.snack.open('در حال حاضر امکان ثبت سفارش وجود ندارد. به زودی برمی‌گردیم.', '', {
        panelClass: 'warning',
        duration: 4000,
      });
      return;
    }

    if (this.auth.isGuestUser && this.cart.isLoginRequired) {
      this.router.navigate(['/login'], { queryParams: { returnPath: '/payment' } });
      return;
    }

    const missedProducts = this.getMissedProducts();
    if (missedProducts.length > 0 && !this.cart.upsellDismissed()) {
      this.router.navigate(['/cart/missed-products'], {
        skipLocationChange: true,
      });
    } else {
      this.router.navigate(['/payment']);
    }
  }
}

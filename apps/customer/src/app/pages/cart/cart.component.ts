import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { ShopService } from '../../core/services/shop.service';
import { AuthService } from '../../core/services/auth.service';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Product } from '@menno/types';
import { ImageLoaderDirective } from '../../shared/directives';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  cart = inject(CartService);
  shopService = inject(ShopService);
  auth = inject(AuthService);
  router = inject(Router);
  snack = inject(MatSnackBar);
  Product = Product;

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

    this.router.navigate(['/payment']);
  }
}

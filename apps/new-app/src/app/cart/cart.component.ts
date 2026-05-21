import { Component } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { ProductItemsComponent } from './product-items/product-items.component';
import { CartService } from '../core/services/cart.service';
import { COMMON } from '../common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService, MenuStatService } from '../core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AnalyticsService } from '../core/services/analytics.service';
import { StatAction } from '@menno/types';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ShopTablesBottomSheetComponent } from '../common/components';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    TopAppBarComponent,
    ProductItemsComponent,
    COMMON,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatToolbarModule,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  noteControl: FormControl;
  constructor(
    public cart: CartService,
    private location: PlatformLocation,
    private router: Router,
    private auth: AuthService,
    private analytics: AnalyticsService,
    private menuStat: MenuStatService,
    private bottomSheet: MatBottomSheet,
  ) {
    this.noteControl = new FormControl(this.cart.note());
    this.noteControl.valueChanges.subscribe((value) => {
      this.cart.note.set(value);
    });
    if (this.cart.length() === 0) {
      this.location.back();
    } else {
      this.menuStat.send(StatAction.ViewCart, { value: this.cart.total() });
    }

    // Track cart view
    this.analytics.trackEvent('view_cart', {
      itemCount: this.cart.length(),
      totalAmount: this.cart.total(),
    });
  }

  async submit() {
    // Track checkout attempt
    this.analytics.trackEvent('proceed_to_checkout', {
      itemCount: this.cart.length(),
      totalAmount: this.cart.total(),
    });

    if (!(await this.ensureTableSelected())) return;

    if (this.auth.isGuestUser && this.cart.isLoginRequired) {
      // Track login requirement
      this.analytics.trackEvent('login_required', {
        returnPath: '/payment',
      });
      this.router.navigate(['/login'], { queryParams: { returnPath: '/payment' } });
    } else {
      // Track checkout start
      this.analytics.trackEvent('checkout_started', {
        itemCount: this.cart.length(),
        totalAmount: this.cart.total(),
      });
      this.router.navigateByUrl('/payment');
    }
  }

  private async ensureTableSelected(): Promise<boolean> {
    if (!this.cart.needsTableSelection()) return true;

    const table = await firstValueFrom(
      this.bottomSheet.open(ShopTablesBottomSheetComponent).afterDismissed(),
    );
    if (!table) return false;

    this.cart.table.set(table.code);
    return true;
  }
}

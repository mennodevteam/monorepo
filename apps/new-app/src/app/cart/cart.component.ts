import { Component } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { ProductItemsComponent } from './product-items/product-items.component';
import { CartService } from '../core/services/cart.service';
import { COMMON } from '../common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    TopAppBarComponent,
    ProductItemsComponent,
    COMMON,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  constructor(
    private cart: CartService,
    private location: PlatformLocation,
  ) {
    if (this.cart.length() === 0) {
      this.location.back();
    }
  }
}

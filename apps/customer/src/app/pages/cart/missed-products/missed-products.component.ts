import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CartService } from '../../../core/services/cart.service';
import { MenuService } from '../../../core/services/menu.service';
import { Product, Menu } from '@menno/types';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { TopAppBarComponent } from '../../../shared/components/top-app-bar/top-app-bar.component';

@Component({
  selector: 'app-missed-products',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatToolbarModule,
    DecimalPipe,
    ProductCardComponent,
    TopAppBarComponent,
  ],
  templateUrl: './missed-products.component.html',
  styleUrl: './missed-products.component.scss',
})
export class MissedProductsComponent {
  readonly cart = inject(CartService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);

  readonly missedProducts = signal<Product[]>([]);

  constructor() {
    const menu = this.menuService.data();
    const orderItems = this.cart.orderItems();
    if (!menu || !orderItems.length) {
      this.router.navigate(['/payment'], { replaceUrl: true });
      return;
    }

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

    const list = Array.from(missed.values());
    if (list.length === 0) {
      this.router.navigate(['/payment'], { replaceUrl: true });
      return;
    }
    this.missedProducts.set(list);
  }

  skip() {
    this.router.navigate(['/payment']);
  }

  proceedToCheckout() {
    this.router.navigate(['/payment']);
  }
}

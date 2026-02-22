import { Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CartService } from '../../../core/services/cart.service';
import { MenuService } from '../../../core/services/menu.service';
import { Product, Menu } from '@menno/types';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-upsell-products',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatToolbarModule, ProductCardComponent],
  templateUrl: './missed-products.component.html',
  styleUrl: './missed-products.component.scss',
})
export class UpsellProductsComponent {
  private static readonly INTRO_TITLE_TEXT = 'یک لحظه صبر کن!';
  private static readonly INTRO_DESCRIPTION_TEXT = 'چیزی فراموش نکردی؟';

  readonly cart = inject(CartService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly missedProducts = signal<Product[]>([]);
  readonly isUpselIntroDone = signal(false);
  readonly typedTitle = signal('');
  readonly typedDescription = signal('');
  readonly isTitleTyping = signal(true);
  readonly isDescriptionTyping = signal(false);

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

    this.startUpselIntroTyping();
  }

  skip() {
    this.cart.dismissUpsell();
    this.router.navigate(['/payment']);
  }

  proceedToCheckout() {
    this.router.navigate(['/payment']);
  }

  private startUpselIntroTyping() {
    this.typeText(
      UpsellProductsComponent.INTRO_TITLE_TEXT,
      this.typedTitle,
      38,
      () => {
        this.isTitleTyping.set(false);

        const titlePauseTimer = window.setTimeout(() => {
          this.isDescriptionTyping.set(true);
          this.typeText(
            UpsellProductsComponent.INTRO_DESCRIPTION_TEXT,
            this.typedDescription,
            30,
            () => {
              this.isDescriptionTyping.set(false);
              const revealTimer = window.setTimeout(() => {
                this.isUpselIntroDone.set(true);
              }, 250);
              this.destroyRef.onDestroy(() => window.clearTimeout(revealTimer));
            },
          );
        }, 650);

        this.destroyRef.onDestroy(() => window.clearTimeout(titlePauseTimer));
      },
    );
  }

  private typeText(text: string, target: WritableSignal<string>, speed: number, onDone: () => void) {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      target.set(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
        onDone();
      }
    }, speed);

    this.destroyRef.onDestroy(() => window.clearInterval(timer));
  }
}

import { Component, EventEmitter, Input, Output, WritableSignal, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';
import { Product, ProductVariant } from '@menno/types';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
})
export class QuantitySelectorComponent {
  @Input() product: Product;
  @Input() variant: ProductVariant;
  value?: WritableSignal<number>;

  constructor(public cart: CartService) {
    effect(() => {
      const item = this.cart.getSignalItem(this.product?.id, this.variant?.id);
      this.value = item?.quantity;
    });
  }
}

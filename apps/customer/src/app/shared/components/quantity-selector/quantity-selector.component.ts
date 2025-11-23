import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxAddSquareOutline, saxMinusSquareOutline } from '@ng-icons/iconsax/outline';
import { saxAddSquareBold } from '@ng-icons/iconsax/bold';
import { StopPropagationDirective } from '../../directives';
import { CartService } from '../../../core/services/cart.service';
import { Product, ProductVariant } from '@menno/types';

@Component({
  selector: 'app-quantity-selector',
  imports: [NgIcon, MatButtonModule, StopPropagationDirective],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'quantity-selector',
  },
  providers: [
    provideIcons({
      saxAddSquareOutline,
      saxMinusSquareOutline,
      saxAddSquareBold,
    }),
  ],
})
export class QuantitySelectorComponent {
  readonly product = input.required<Product>();
  readonly variant = input<ProductVariant>();

  private readonly cart = inject(CartService);

  readonly incrementIcon = saxAddSquareOutline;
  readonly decrementIcon = saxMinusSquareOutline;
  readonly addIcon = saxAddSquareBold;

  private readonly cartItem = computed(() => this.cart.getSignalItem(this.product().id, this.variant()?.id));

  readonly value = computed(() => this.cartItem()?.quantity() || 0);

  readonly canDecrement = computed(() => {
    return this.value() > 0;
  });

  readonly canIncrement = computed(() => {
    return true;
  });

  decrement(): void {
    this.cart.minus(this.product(), this.variant());
  }

  increment(): void {
    this.cart.plus(this.product(), this.variant());
  }
}

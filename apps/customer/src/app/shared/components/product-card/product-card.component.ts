import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardContent } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { Product, ProductVariant, Status } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';

type PriceDetails = {
  current: number;
  original: number | null;
  discountPercentage: number | null;
  variant: ProductVariant | null;
};

@Component({
  selector: 'app-product-card',
  imports: [
    MatCard,
    MatCardContent,
    RouterLink,
    DecimalPipe,
    ImageLoaderDirective,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-product-card',
  },
})
export class ProductCardComponent {
  private static readonly FALLBACK_CURRENCY_LABEL = 'تومان';

  readonly product = input.required<Product>();
  readonly routerLink = input<(string | number)[] | string | undefined>();
  readonly queryParams = input<Record<string, unknown> | undefined>();
  readonly currencyLabel = input(ProductCardComponent.FALLBACK_CURRENCY_LABEL);
  readonly showDescription = input(true);
  readonly showVariantHint = input(true);

  private readonly details = computed<PriceDetails>(() => {
    const product = this.product();
    const variants = product.variants ?? [];

    if (variants.length === 0) {
      const hasDiscount = Product.hasDiscount(product);
      return {
        current: Product.totalPrice(product),
        original: hasDiscount ? Product.realPrice(product) : null,
        discountPercentage: hasDiscount ? Product.percentageDiscount(product) : null,
        variant: null,
      };
    }

    let bestVariant = variants[0]!;
    let lowestTotal = Product.totalPrice(product, bestVariant);

    for (const variant of variants.slice(1)) {
      const total = Product.totalPrice(product, variant);
      if (total < lowestTotal) {
        bestVariant = variant;
        lowestTotal = total;
      }
    }

    const hasDiscount = Product.hasDiscount(product, bestVariant);

    return {
      current: lowestTotal,
      original: hasDiscount ? Product.realPrice(product, bestVariant) : null,
      discountPercentage: hasDiscount ? Product.percentageDiscount(product, bestVariant) : null,
      variant: bestVariant,
    };
  });

  readonly imageFile = computed(() => Product.mainImageFile(this.product()) ?? undefined);
  readonly imageSource = computed(() => {
    const product = this.product();
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return undefined;
  });

  readonly price = computed(() => this.details().current);
  readonly originalPrice = computed(() => this.details().original);
  readonly discountPercentage = computed(() => this.details().discountPercentage);
  readonly variantLabel = computed(() => this.details().variant?.title ?? null);

  readonly isUnavailable = computed(() => {
    const product = this.product();
    const variants = product.variants ?? [];
    if (!variants.length) {
      return Product.isFinished(product);
    }
    return variants.every((variant) => Product.isFinished(product, variant));
  });

  readonly statusLabel = computed(() => {
    const product = this.product();
    if (product.status === Status.Inactive || product.status === Status.Blocked) {
      return 'غیرفعال';
    }
    if (this.isUnavailable()) {
      return 'ناموجود';
    }
    return null;
  });
}


import { Component, computed, input, inject } from '@angular/core';
import { Router, RouterLinkWithHref } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { DecimalPipe } from '@angular/common';
import { Product, ProductVariant } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';
import { MatRippleModule } from '@angular/material/core';
import { QuantitySelectorComponent } from '../quantity-selector/quantity-selector.component';
import { LinkService } from '../../../core/services/link.service';

@Component({
  selector: 'app-product-card',
  imports: [
    MatCardModule,
    MatListModule,
    DecimalPipe,
    ImageLoaderDirective,
    MatRippleModule,
    QuantitySelectorComponent,
    RouterLinkWithHref,
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly largeImage = input(true);
  readonly hideVariants = input(false);
  readonly designVariant = input<'default' | 'list'>('default');

  readonly variants = computed(() => this.product().variants ?? []);
  readonly hasVariants = computed(() => this.variants().length > 0);

  readonly imageFile = computed(() => Product.mainImageFile(this.product()) ?? undefined);

  readonly totalPrice = computed(() => Product.totalPrice(this.product()));
  readonly hasDiscount = computed(() => Product.hasDiscount(this.product()));
  readonly realPrice = computed(() => (this.hasDiscount() ? Product.realPrice(this.product()) : null));
  readonly fixedDiscount = computed(() =>
    this.hasDiscount() ? Product.fixedDiscount(this.product()) : null,
  );
  readonly percentageDiscount = computed(() =>
    this.hasDiscount() ? Product.percentageDiscount(this.product()) : null,
  );
  readonly hasAnyDiscount = computed(() => {
    const variants = this.variants();
    if (variants.length) {
      return variants.some((variant) => Product.hasDiscount(this.product(), variant));
    }
    return Product.hasDiscount(this.product());
  });
  readonly discountBadge = computed(() => {
    const variants = this.variants();
    if (variants.length) {
      const discountedVariants = variants.filter((variant) => Product.hasDiscount(this.product(), variant));
      if (!discountedVariants.length) return 0;

      return Math.max(
        ...discountedVariants.map((variant) =>
          this.roundUpToFive(Product.percentageDiscount(this.product(), variant, 1)),
        ),
      );
    }

    if (!Product.hasDiscount(this.product())) return 0;
    return this.roundUpToFive(Product.percentageDiscount(this.product(), undefined, 1));
  });
  readonly isFinished = computed(() => {
    const variants = this.variants();
    if (!variants.length) {
      return Product.isFinished(this.product());
    }
    return variants.every((variant) => Product.isFinished(this.product(), variant));
  });

  readonly variantTotalPrice = (variant: ProductVariant) => Product.totalPrice(this.product(), variant);
  readonly variantHasDiscount = (variant: ProductVariant) => Product.hasDiscount(this.product(), variant);
  readonly variantRealPrice = (variant: ProductVariant) =>
    this.variantHasDiscount(variant) ? Product.realPrice(this.product(), variant) : null;
  readonly variantFixedDiscount = (variant: ProductVariant) =>
    this.variantHasDiscount(variant) ? Product.fixedDiscount(this.product(), variant) : null;
  readonly variantPercentageDiscount = (variant: ProductVariant) =>
    this.variantHasDiscount(variant) ? Product.percentageDiscount(this.product(), variant) : null;
  readonly variantIsFinished = (variant: ProductVariant) => Product.isFinished(this.product(), variant);

  private readonly router = inject(Router);
  private readonly linkService = inject(LinkService);

  readonly productLink = computed(() => this.linkService.getProductLink(this.product()));

  private roundUpToFive(value: number) {
    if (value <= 0) return 0;
    return Math.ceil(value / 5) * 5;
  }

  openProduct() {
    this.router.navigateByUrl(this.productLink());
  }
}

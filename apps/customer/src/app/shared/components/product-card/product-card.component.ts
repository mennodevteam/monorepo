import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { DecimalPipe } from '@angular/common';
import { Product, ProductVariant } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';
import { MatRippleModule } from '@angular/material/core';
import { saxStopCircleBold } from '@ng-icons/iconsax/bold';
import { NgIcon, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-product-card',
  imports: [MatCardModule, MatListModule, DecimalPipe, ImageLoaderDirective, MatRippleModule, NgIcon],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  providers: [
    provideIcons({
      saxStopCircleBold,
    }),
  ],
})
export class ProductCardComponent {
  readonly stopCircleIcon = saxStopCircleBold;
  readonly product = input.required<Product>();
  readonly showDescription = input(true);
  readonly showVariants = input(true);
  readonly showPrice = input(true);
  readonly largeImage = input(true);

  readonly variants = computed(() => this.product().variants ?? []);
  readonly hasVariants = computed(() => this.variants().length > 0);
  readonly firstVariant = computed(() => this.variants()[0] ?? null);
  readonly firstVariantTitle = computed(() => this.firstVariant()?.title ?? null);

  readonly imageFile = computed(() => Product.mainImageFile(this.product()) ?? undefined);
  readonly imageSource = computed(() => {
    const product = this.product();
    const images = product.images ?? [];
    return images.length > 0 ? images[0] : undefined;
  });

  readonly totalPrice = computed(() => Product.totalPrice(this.product()));
  readonly hasDiscount = computed(() => Product.hasDiscount(this.product()));
  readonly realPrice = computed(() => (this.hasDiscount() ? Product.realPrice(this.product()) : null));
  readonly fixedDiscount = computed(() =>
    this.hasDiscount() ? Product.fixedDiscount(this.product()) : null,
  );
  readonly percentageDiscount = computed(() =>
    this.hasDiscount() ? Product.percentageDiscount(this.product()) : null,
  );
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
}

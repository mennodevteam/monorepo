import { Component, computed, effect, inject, OnDestroy, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { Product, ProductVariant, ProductCategory, Menu, StatAction } from '@menno/types';
import { MenuService } from '../../core/services/menu.service';
import { MenuStatService } from '../../core/services/menu-stat.service';
import { TitleService } from '../../core/services/title.service';
import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    DecimalPipe,
    ImageLoaderDirective,
    MatRippleModule,
    QuantitySelectorComponent,
    ProductCardComponent,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
  providers: [],
})
export class ProductComponent implements OnDestroy {
  private readonly menuService = inject(MenuService);
  private readonly menuStat = inject(MenuStatService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(TitleService);

  private readonly productIdParam = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  readonly productId = computed(() => this.productIdParam());

  readonly product = computed(() => {
    const productParam = this.productId();
    const menu = this.menuService.data();
    if (!productParam || !menu) {
      return undefined;
    }
    // Try to find by slug first, then by id
    const bySlug = menu.categories
      ?.reduce((acc: Product[], cat: ProductCategory) => acc.concat(cat.products || []), [])
      .find((p: Product) => p.slug === productParam);
    if (bySlug) return bySlug;
    return Menu.getProductById(menu, productParam) || undefined;
  });

  readonly variants = computed(() => this.product()?.variants ?? []);
  readonly hasVariants = computed(() => this.variants().length > 0);

  readonly images = computed(() => {
    const p = this.product();
    if (!p) return [];
    if (p.imageFiles) {
      return Array.isArray(p.imageFiles) ? p.imageFiles : [p.imageFiles];
    }
    if (p.images) {
      return p.images;
    }
    return [];
  });

  readonly totalPrice = computed(() => {
    const p = this.product();
    return p ? Product.totalPrice(p) : 0;
  });
  readonly hasDiscount = computed(() => {
    const p = this.product();
    return p ? Product.hasDiscount(p) : false;
  });
  readonly hasAnyDiscount = computed(() => {
    const p = this.product();
    if (!p) return false;

    const variants = p.variants ?? [];
    if (variants.length) {
      return variants.some((variant) => Product.hasDiscount(p, variant));
    }
    return Product.hasDiscount(p);
  });
  readonly discountBadge = computed(() => {
    const p = this.product();
    if (!p) return 0;

    const variants = p.variants ?? [];
    if (variants.length) {
      const discountedVariants = variants.filter((variant) => Product.hasDiscount(p, variant));
      if (!discountedVariants.length) return 0;

      return Math.max(
        ...discountedVariants.map((variant) =>
          this.roundUpToFive(Product.percentageDiscount(p, variant, 1)),
        ),
      );
    }

    if (!Product.hasDiscount(p)) return 0;
    return this.roundUpToFive(Product.percentageDiscount(p, undefined, 1));
  });
  readonly isUnavailable = computed(() => {
    const p = this.product();
    return p ? Product.isUnavailable(p) : false;
  });
  readonly realPrice = computed(() => {
    const p = this.product();
    return this.hasDiscount() && p ? Product.realPrice(p) : null;
  });

  readonly relatedProducts = computed(() => {
    const p = this.product();
    const menu = this.menuService.data();
    if (!p?.relatedProductIds?.length || !menu) return [];
    const products: Product[] = [];
    for (const id of p.relatedProductIds) {
      const product = Menu.getProductById(menu, id);
      if (product) products.push(product);
    }
    return products;
  });

  readonly useRelatedMultiRowCarousel = computed(() => this.relatedProducts().length > 3);

  getRelatedProductsRowIndices(): number[] {
    return this.useRelatedMultiRowCarousel() ? [0, 1] : [0];
  }

  getRelatedProductsForRow(rowIndex: number): Product[] {
    const all = this.relatedProducts();
    const rows = this.useRelatedMultiRowCarousel() ? 2 : 1;
    return all.filter((_, i) => i % rows === rowIndex);
  }

  isImage(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'md' in value;
  }

  readonly variantTotalPrice = (variant: ProductVariant) => {
    const p = this.product();
    return p ? Product.totalPrice(p, variant) : 0;
  };
  readonly variantHasDiscount = (variant: ProductVariant) => {
    const p = this.product();
    return p ? Product.hasDiscount(p, variant) : false;
  };
  readonly variantRealPrice = (variant: ProductVariant) => {
    const p = this.product();
    return this.variantHasDiscount(variant) && p ? Product.realPrice(p, variant) : null;
  };

  private roundUpToFive(value: number) {
    if (value <= 0) return 0;
    return Math.ceil(value / 5) * 5;
  }

  readonly activeImageIndex = signal(0);
  private readonly carousel = viewChild<ElementRef<HTMLElement>>('carousel');
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastClickProductId: string | null = null;

  ngOnDestroy(): void {
    this.titleService.clearTitle();
    this.stopAutoScroll();
  }

  private startAutoScroll() {
    this.stopAutoScroll();
    if (this.images().length <= 1) return;

    this.intervalId = setInterval(() => {
      const nextIndex = (this.activeImageIndex() + 1) % this.images().length;
      this.scrollToIndex(nextIndex);
    }, 3000);
  }

  private stopAutoScroll() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  scrollToIndex(index: number) {
    this.activeImageIndex.set(index);
    const carouselEl = this.carousel()?.nativeElement;
    if (carouselEl) {
      const target = carouselEl.children[index] as HTMLElement;
      if (target) {
        // Subtract padding (16px) to align correctly
        carouselEl.scrollTo({ left: target.offsetLeft - 16, behavior: 'smooth' });
      }
    }
  }

  onCarouselScroll() {
    this.stopAutoScroll();

    const carouselEl = this.carousel()?.nativeElement;
    if (carouselEl) {
      // Find the image closest to the center of the viewport
      const centerX = carouselEl.scrollLeft + carouselEl.clientWidth / 2;
      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      Array.from(carouselEl.children).forEach((child, index) => {
        const childEl = child as HTMLElement;
        // Calculate center of the child
        const childCenterX = childEl.offsetLeft + childEl.offsetWidth / 2;
        const distance = Math.abs(childCenterX - centerX);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== this.activeImageIndex()) {
        this.activeImageIndex.set(closestIndex);
      }
    }

    // Restart timer after interaction
    this.startAutoScroll();
  }

  readonly isExpanded = signal(false);
  readonly showReadMore = signal(false);
  readonly descriptionEl = viewChild<ElementRef<HTMLParagraphElement>>('description');

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        this.titleService.setTitle(product.title);
        if (this.lastClickProductId !== product.id) {
          this.lastClickProductId = product.id;
          this.menuStat.send(StatAction.ClickProduct, { productId: product.id });
        }
      }
    });

    effect((onCleanup) => {
      this.startAutoScroll();
      onCleanup(() => this.stopAutoScroll());
    });

    effect(() => {
      const el = this.descriptionEl()?.nativeElement;
      const product = this.product();
      if (el && product) {
        // Wait for render
        setTimeout(() => {
          this.showReadMore.set(el.scrollHeight > el.clientHeight);
        });
      }
    });
  }

  toggleDescription() {
    this.isExpanded.update((v) => !v);
  }
}

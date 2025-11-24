import { Component, computed, effect, inject, OnDestroy, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { Product, ProductVariant, Menu } from '@menno/types';
import { MenuService } from '../../core/services/menu.service';
import { TitleService } from '../../core/services/title.service';
import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';

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
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
  providers: [],
})
export class ProductComponent implements OnDestroy {
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(TitleService);

  private readonly productIdParam = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

  readonly productId = computed(() => this.productIdParam());

  readonly product = computed(() => {
    const id = this.productId();
    const menu = this.menuService.data();
    if (!id || !menu) {
      return undefined;
    }
    return Menu.getProductById(menu, id) || undefined;
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
  readonly realPrice = computed(() => {
    const p = this.product();
    return this.hasDiscount() && p ? Product.realPrice(p) : null;
  });

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

  readonly activeImageIndex = signal(0);
  private readonly carousel = viewChild<ElementRef<HTMLElement>>('carousel');
  private intervalId: ReturnType<typeof setInterval> | null = null;

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

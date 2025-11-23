import { Component, computed, effect, inject, OnDestroy } from '@angular/core';
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

  readonly totalPrice = computed(() => (this.product() ? Product.totalPrice(this.product()!) : 0));
  readonly hasDiscount = computed(() => (this.product() ? Product.hasDiscount(this.product()!) : false));
  readonly realPrice = computed(() =>
    this.hasDiscount() && this.product() ? Product.realPrice(this.product()!) : null,
  );

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        this.titleService.setTitle(product.title);
      }
    });
  }

  ngOnDestroy(): void {
    this.titleService.clearTitle();
  }

  isImage(value: any): boolean {
    return typeof value === 'object' && value !== null && 'md' in value;
  }

  readonly variantTotalPrice = (variant: ProductVariant) =>
    this.product() ? Product.totalPrice(this.product()!, variant) : 0;
  readonly variantHasDiscount = (variant: ProductVariant) =>
    this.product() ? Product.hasDiscount(this.product()!, variant) : false;
  readonly variantRealPrice = (variant: ProductVariant) =>
    this.variantHasDiscount(variant) && this.product() ? Product.realPrice(this.product()!, variant) : null;
}

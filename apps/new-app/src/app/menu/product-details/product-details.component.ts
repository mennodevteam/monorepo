import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';

import { COMMON } from '../../common';
import { Product, StatAction } from '@menno/types';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuService, MenuStatService, flyInOutFromDown } from '../../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { QuantitySelectorComponent } from '../../common/components/quantity-selector/quantity-selector.component';
import { CartService } from '../../core/services/cart.service';
import { ImageCarouselComponent } from '../../common/components/image-carousel/image-carousel.component';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [COMMON, MatToolbarModule, MatListModule, QuantitySelectorComponent, ImageCarouselComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  animations: [flyInOutFromDown()],
})
export class ProductDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly menuStat = inject(MenuStatService);
  Product = Product;
  product: Product;
  variantsListElement = viewChild('variantsList', { read: ElementRef });
  hasInCart = computed(() => {
    return !!this.cart.quantity().find((x) => x.productId === this.product?.id && x.quantity);
  });
  isFirstRoute = this.router.currentNavigation()?.previousNavigation == null;
  constructor(
    public menuService: MenuService,
    public cart: CartService,
  ) {
    const id = this.route.snapshot.params['id'];
    const product = this.menuService.getProductById(id);
    if (product) {
      this.product = product;

      this.menuStat.send(StatAction.ClickProduct, { productId: this.product.id });
    }
  }

  submit() {
    if (this.product.variants?.length)
      this.variantsListElement()?.nativeElement.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });

    if (this.product.variants?.length === 0) this.cart.plus(this.product);
    if (this.product.variants?.length === 1) this.cart.plus(this.product, this.product.variants[0]);
  }

  get imageFiles() {
    return Array.isArray(this.product.imageFiles)
      ? this.product.imageFiles
      : this.product.imageFiles
        ? [this.product.imageFiles]
        : undefined;
  }
}

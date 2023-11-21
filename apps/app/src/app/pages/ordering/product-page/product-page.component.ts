import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product, ProductVariant, Status } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss'],
})
export class ProductPageComponent {
  product: Product | null;
  Status = Status;
  Product = Product;
  @ViewChild('selectButtonRow') selectButtonRow: ElementRef;
  initCount = 0;

  constructor(
    private menuService: MenuService,
    private route: ActivatedRoute,
    public basket: BasketService,
    public shopService: ShopService
  ) {
    this.route.params.subscribe((params) => {
      this.product = this.menuService.getProductById(params['id']);
      console.log(this.product)
      if (this.product) {
        const item = this.basket.getItem(this.product.id);
        if (item) this.initCount = item.quantity;
      }
    });
  }

  get image() {
    return this.product?.images ? this.product?.images[0] : '';
  }

  plus(variant?: ProductVariant, scrollEnd?: boolean) {
    if (this.product) {
      if (!this.product.variants?.length) this.basket.plus(this.product, variant);
      else if (this.product.variants.length === 1) this.basket.plus(this.product, this.product.variants[0]);
      else if (variant) {
        this.basket.plus(this.product, variant);
      }
    }
    if (scrollEnd) {
      this.selectButtonRow.nativeElement.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  minus(variant?: ProductVariant) {
    if (this.product) {
      if (!this.product.variants?.length) this.basket.minus(this.product, variant);
      else if (this.product.variants.length === 1) this.basket.minus(this.product, this.product.variants[0]);
      else if (variant) {
        this.basket.minus(this.product, variant);
      }
    }
  }
}

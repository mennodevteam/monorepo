import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss'],
})
export class ProductPageComponent {
  product: Product | null;
  Product = Product;
  initCount = 0;

  constructor(
    private menuService: MenuService,
    private route: ActivatedRoute,
    private basket: BasketService
  ) {
    this.route.params.subscribe((params) => {
      this.product = this.menuService.getProductById(params['id']);

      if (this.product) {
        const item = this.basket.getItem(this.product.id);
        if (item) this.initCount = item.quantity;
      }
    });
  }

  get image() {
    return this.product?.images ? this.product?.images[0] : '';
  }

  plus() {
    if (this.product) this.basket.plus(this.product);
  }

  minus() {
    if (this.product) this.basket.minus(this.product);
  }
}

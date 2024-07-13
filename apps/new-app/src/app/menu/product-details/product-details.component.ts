import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { Product } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { MenuService, flyInOutFromDown } from '../../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { QuantitySelectorComponent } from '../../common/components/quantity-selector/quantity-selector.component';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule, MatListModule, QuantitySelectorComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  animations: [flyInOutFromDown()]
})
export class ProductDetailsComponent {
  Product = Product;
  product: Product;
  constructor(
    private route: ActivatedRoute,
    private menuService: MenuService,
    public cart: CartService
  ) {
    const id = this.route.snapshot.params['id'];
    const product = this.menuService.getProductById(id);
    if (product) {
      this.product = product;
    }
  }
}

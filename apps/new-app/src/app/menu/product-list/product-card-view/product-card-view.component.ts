import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../../common';
import { Product, ProductCategory } from '@menno/types';
import { MatCardModule } from '@angular/material/card'
import { QuantitySelectorComponent } from "../../../common/components/quantity-selector/quantity-selector.component";
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card-view',
  standalone: true,
  imports: [CommonModule, COMMON, MatCardModule, QuantitySelectorComponent],
  templateUrl: './product-card-view.component.html',
  styleUrl: './product-card-view.component.scss',
})
export class ProductCardViewComponent {
  Product = Product;
  @Input() category: ProductCategory;

  constructor(public cart: CartService) {}
}

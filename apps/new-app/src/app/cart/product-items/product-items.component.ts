import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { MatCardModule } from '@angular/material/card';
import { CartService } from '../../core/services/cart.service';
import { Product } from '@menno/types';
import { QuantitySelectorComponent } from "../../common/components/quantity-selector/quantity-selector.component";

@Component({
  selector: 'app-product-items',
  standalone: true,
  imports: [CommonModule, COMMON, MatCardModule, QuantitySelectorComponent],
  templateUrl: './product-items.component.html',
  styleUrl: './product-items.component.scss',
})
export class ProductItemsComponent {
  Product = Product;
  constructor(public cart: CartService){}
}

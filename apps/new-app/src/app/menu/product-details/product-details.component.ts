import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { Product } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule, MatListModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent {
  Product = Product;
  product: Product;
  constructor(private route: ActivatedRoute, private menuService: MenuService) {
    const id = this.route.snapshot.params['id'];
    const product = this.menuService.getProductById(id);
    if (product) {
      this.product = product;
    }
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '@menno/types';
import { COMMON } from '../../../common';


@Component({
  selector: 'app-product-carousel-item',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './product-carousel-item.component.html',
  styleUrl: './product-carousel-item.component.scss',
})
export class ProductCarouselItemComponent {
  @Input() product: Product;
  Product = Product;
}

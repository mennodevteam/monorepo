import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCategory, Product } from '@menno/types';
import { COMMON } from '../../../common';
import { ProductCarouselItemComponent } from './product-carousel-item.component';

@Component({
  selector: 'app-product-carousel-view',
  standalone: true,
  imports: [CommonModule, COMMON, ProductCarouselItemComponent],
  templateUrl: './product-carousel-view.component.html',
  styleUrl: './product-carousel-view.component.scss',
})
export class ProductCarouselViewComponent {
  @Input() category: ProductCategory;

  get products(): Product[] {
    return this.category?.products ?? [];
  }
}

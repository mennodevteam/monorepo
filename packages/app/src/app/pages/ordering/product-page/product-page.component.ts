import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '@menno/types';
import { DataService } from '../data.service';

@Component({
  selector: 'product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss'],
})
export class ProductPageComponent {
  product: Product | null;

  constructor(private data: DataService, private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.product = this.data.getProductById(params['id']);
    });
  }

  get image() {
    return this.product?.images ? this.product?.images[0] : '';
  }
}

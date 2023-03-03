import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BasketService } from '../../../core/services/basket.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'basket-page',
  templateUrl: './basket-page.component.html',
  styleUrls: ['./basket-page.component.scss'],
})
export class BasketPageComponent {
  constructor(public basket: BasketService, private router: Router, private shopService: ShopService) {
    if (!this.basket.items?.length)
      this.router.navigate(['/menu'], {
        replaceUrl: true,
      });
  }

  get items() {
    return this.basket.items || [];
  }

  complete() {
    this.basket.complete();
  }

  get disableOrdering() {
    return this.shopService.shop?.appConfig?.disableOrdering;
  }
}

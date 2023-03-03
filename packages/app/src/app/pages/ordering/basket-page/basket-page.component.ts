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
  saving = false;
  constructor(public basket: BasketService, private router: Router, private shopService: ShopService) {
    if (!this.basket.items?.length)
      this.router.navigate(['/menu'], {
        replaceUrl: true,
      });
  }

  get items() {
    return this.basket.items || [];
  }

  async complete() {
    this.saving = true;
    try {
      const order = await this.basket.complete();
      if (order) {
        this.router.navigateByUrl(`/orders/details/${order.id}`);
      } else {
        this.saving = false;
      }
    } catch (error) {
      this.saving = false;
    }
  }

  get disableOrdering() {
    return this.shopService.shop?.appConfig?.disableOrdering;
  }
}

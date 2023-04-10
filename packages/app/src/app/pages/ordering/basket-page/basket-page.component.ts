import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BasketService } from '../../../core/services/basket.service';
import { ShopService } from '../../../core/services/shop.service';
import { OrderType } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'basket-page',
  templateUrl: './basket-page.component.html',
  styleUrls: ['./basket-page.component.scss'],
})
export class BasketPageComponent {
  saving = false;
  constructor(
    public basket: BasketService,
    private router: Router,
    private shopService: ShopService,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    if (!this.basket.items?.length) {
      this.router.navigate(['/menu'], {
        replaceUrl: true,
      });
    } else if (this.basket.type === OrderType.Delivery && !this.basket.address) {
      this.router.navigate(['/menu'], {
        replaceUrl: true,
      });
      this.snack.open(this.translate.instant('menu.selectDeliveryAddress'), '', { duration: 2000 });
    } else if (
      this.basket.type === OrderType.DineIn &&
      !this.basket.details?.table &&
      this.shopService.shop?.details.tables?.length
    ) {
      this.router.navigate(['/menu'], {
        replaceUrl: true,
      });
      this.snack.open(this.translate.instant('menu.selectDineInTable'), '', { duration: 2000 });
    }
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

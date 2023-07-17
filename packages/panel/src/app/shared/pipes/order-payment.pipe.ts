import { Pipe, PipeTransform } from '@angular/core';
import { OrderPaymentType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../core/services/shop.service';

@Pipe({
  name: 'orderPayment',
})
export class OrderPaymentPipe implements PipeTransform {
  constructor(private translate: TranslateService, private shopService: ShopService) {}

  transform(type: OrderPaymentType, posPayed?: number[]): unknown {
    const posIndex = posPayed?.findIndex((x) => x > 0);
    const pos =
      posIndex && this.shopService.shop?.details?.poses && this.shopService.shop?.details?.poses[posIndex];
    switch (type) {
      case OrderPaymentType.Online:
        return this.translate.instant('orderPaymentType.online');
      case OrderPaymentType.Cash:
        return pos || this.translate.instant('orderPaymentType.cash');
      case OrderPaymentType.ClubWallet:
        return this.translate.instant('orderPaymentType.clubWallet');
      default:
        return this.translate.instant('orderPaymentType.notPayed');
    }
  }
}

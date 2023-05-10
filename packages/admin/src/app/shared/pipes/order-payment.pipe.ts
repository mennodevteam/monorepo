import { Pipe, PipeTransform } from '@angular/core';
import { OrderPaymentType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orderPayment',
})
export class OrderPaymentPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(type: OrderPaymentType): unknown {
    switch (type) {
      case OrderPaymentType.Online:
        return this.translate.instant('orderPaymentType.online');
      case OrderPaymentType.Cash:
        return this.translate.instant('orderPaymentType.cash');
      case OrderPaymentType.ClubWallet:
        return this.translate.instant('orderPaymentType.clubWallet');
      default:
        return this.translate.instant('orderPaymentType.notPayed');
    }
  }
}

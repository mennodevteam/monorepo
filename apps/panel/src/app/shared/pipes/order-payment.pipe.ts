import { Pipe, PipeTransform } from '@angular/core';
import { OrderPaymentType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../core/services/shop.service';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'orderPayment',
})
export class OrderPaymentPipe implements PipeTransform {
  constructor(
    private translate: TranslateService,
    private shopService: ShopService,
    private decimalPipe: DecimalPipe
  ) {}

  transform(type: OrderPaymentType, posPayed?: number[], totalPrice?: number): unknown {
    const poses = this.shopService.shop?.details?.poses;
    const posPayedText: [string, number][] = [];
    if (posPayed?.length && poses?.length) {
      for (let i = 0; i < poses.length; i++) {
        if (posPayed[i] > 0) posPayedText.push([poses[i], posPayed[i]]);
      }
    }
    switch (type) {
      case OrderPaymentType.Online:
        return this.translate.instant('orderPaymentType.online');
      case OrderPaymentType.Cash:
        switch (posPayedText.length) {
          case 0:
            return this.translate.instant('orderPaymentType.cash');
          case 1:
            if (totalPrice && posPayedText[0][1] < totalPrice) {
              return `${posPayedText[0][0]}: ${this.decimalPipe.transform(posPayedText[0][1])}`;
            }
            return posPayedText[0][0];
          default:
            return posPayedText.map((x) => `${x[0]}: ${this.decimalPipe.transform(x[1])}`).join(` - `);
            break;
        }
      case OrderPaymentType.ClubWallet:
        return this.translate.instant('orderPaymentType.clubWallet');
      default:
        return this.translate.instant('orderPaymentType.notPayed');
    }
  }
}

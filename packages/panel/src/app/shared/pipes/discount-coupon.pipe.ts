import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiscountCoupon } from '@menno/types';
import { MenuCurrencyPipe } from './menu-currency.pipe';

@Pipe({
  name: 'discountCoupon'
})
export class DiscountCouponPipe implements PipeTransform {
  constructor(
    private translate: TranslateService,
    private menuCurrency: MenuCurrencyPipe,
  ) {}

  transform(value: DiscountCoupon, ...args: unknown[]): string {
    let res = '';
    if (value.fixedDiscount) {
      res += this.menuCurrency.transform(value.fixedDiscount)
    } else if (value.percentageDiscount) {
      res += `${value.percentageDiscount}%`;
      if (value.maxDiscount) {
        res += ` ${this.translate.instant('app.to')} ${this.menuCurrency.transform(value.maxDiscount)}`
      }
    }

    if (value.minPrice) {
      res += ` (${this.translate.instant('discountCouponEdit.minPrice')}: ${this.menuCurrency.transform(value.minPrice)})`
    }
    return res;
  }

}

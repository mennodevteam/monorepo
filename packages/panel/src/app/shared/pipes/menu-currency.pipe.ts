import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../core/services/menu.service';
import { ShopService } from '../../core/services/shop.service';

@Pipe({
  name: 'menuCurrency',
})
export class MenuCurrencyPipe implements PipeTransform {
  constructor(
    private shopService: ShopService,
    private decimal: DecimalPipe,
    private translate: TranslateService
  ) {}
  transform(value: any, digitsInfo?: string): string {
    const currency = this.shopService.shop?.menu?.currency || 'تومان';
    try {
      if (value === 0) {
        return '0';
      } else if (value != '' && value != null && !isNaN(value)) {
        return this.decimal.transform(value, digitsInfo || '1.0-0') + ' ' + currency;
      } else {
        return value || '' + currency;
      }
    } catch (error) {
      return value;
    }
  }
}

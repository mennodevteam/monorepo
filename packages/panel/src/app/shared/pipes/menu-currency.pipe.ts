import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../core/services/menu.service';

@Pipe({
  name: 'menuCurrency',
})
export class MenuCurrencyPipe implements PipeTransform {
  currency: string;
  constructor(
    private menuService: MenuService,
    private decimal: DecimalPipe,
    private translate: TranslateService
  ) {
    this.menuService.menu.subscribe((m) => {
      this.currency = m.currency || 'تومان';
    });
  }
  transform(value: any, digitsInfo?: string): string {
    try {
      if (value === 0) {
        return '0';
      } else if (value != '' && value != null && !isNaN(value)) {
        return this.decimal.transform(value, digitsInfo || '1.0-0') + ' ' + this.currency;
      } else {
        return value || '' + this.currency;
      }
    } catch (error) {
      return value;
    }
  }
}

import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../core/services/menu.service';

@Pipe({
  name: 'menuCurrency',
})
export class MenuCurrencyPipe implements PipeTransform {
  constructor(
    private menuService: MenuService,
    private decimal: DecimalPipe,
    private translateService: TranslateService
  ) {}
  transform(value: any, digitsInfo?: string, skipFree?: boolean): string {
    const currency = this.menuService.currency() || 'تومان';
    try {
      if (value !== '' && value != null && !isNaN(value)) {
        if (value != 0 || skipFree) {
          return this.decimal.transform(value, digitsInfo || '1.0-0') + ' ' + currency;
        } else {
          return this.translateService.instant('app.free');
        }
      } else {
        return value || '' + currency;
      }
    } catch (error) {
      return value;
    }
  }
}

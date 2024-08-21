import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../core/services/menu.service';

@Pipe({
  name: 'menuCurrency',
  standalone: true,
})
export class MenuCurrencyPipe implements PipeTransform {
  constructor(private menuService: MenuService, private translateService: TranslateService) {}
  transform(value: any, skipFree?: boolean): string {
    let currency = this.menuService.menu().currency || this.translateService.instant('app.toman');
    if (currency === 'تومان') currency = this.translateService.instant('app.toman');
    try {
      if (value !== '' && value != null && !isNaN(value)) {
        if (value != 0 || skipFree) {
          return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ' + currency;
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

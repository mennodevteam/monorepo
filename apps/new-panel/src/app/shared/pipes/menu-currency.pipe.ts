import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../menu/menu.service';

@Pipe({
  name: 'menuCurrency',
})
export class MenuCurrencyPipe implements PipeTransform {
  constructor(
    private menuService: MenuService,
    private translateService: TranslateService,
  ) {}
  transform(value: any, showFree?: boolean): string {
    const currency = this.menuService.data()?.currency || 'تومان';
    try {
      if (value !== '' && value != null) {
        if (value != 0 || !showFree) {
          return value + ' ' + currency;
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

import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../core/services/menu.service';
import { ShopService } from '../../core/services/shop.service';

@Pipe({
  name: 'table',
})
export class TablePipe implements PipeTransform {
  constructor(private shopService: ShopService) {}
  transform(value?: string): string {
    if (value) {
      let res = value;
      const table = this.shopService.shop?.details?.tables?.find((x) => x.code === value);
      if (table) {
        res += ` (${table.title})`;
      }
    }
    return '';
  }
}

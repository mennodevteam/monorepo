import { Pipe, PipeTransform } from '@angular/core';
import { OrderType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orderType',
  standalone: true,
})
export class OrderTypePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(value: OrderType): unknown {
    return this.translate.instant(`orderType.${value}`);
  }
}

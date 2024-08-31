import { Pipe, PipeTransform } from '@angular/core';
import { OrderType } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orderType',
})
export class OrderTypePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(type: OrderType, isPost?: boolean): unknown {
    switch (type) {
      case OrderType.DineIn:
        return this.translate.instant('orderType.dineIn');
      case OrderType.Delivery:
        return isPost ? this.translate.instant('orderType.post') : this.translate.instant('orderType.delivery');
      case OrderType.Takeaway:
        return this.translate.instant('orderType.takeaway');
    }
  }
}

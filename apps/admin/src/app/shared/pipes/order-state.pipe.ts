import { Pipe, PipeTransform } from '@angular/core';
import { OrderState } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'orderState',
})
export class OrderStatePipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(state: OrderState): unknown {
    switch (state) {
      case OrderState.Canceled:
        return this.translate.instant('orderState.canceled');
      case OrderState.Pending:
        return this.translate.instant('orderState.pending');
      case OrderState.Processing:
        return this.translate.instant('orderState.processing');
      case OrderState.Shipping:
        return this.translate.instant('orderState.shipping');
      case OrderState.Completed:
        return this.translate.instant('orderState.completed');
      case OrderState.Ready:
        return this.translate.instant('orderState.ready');
    }
  }
}

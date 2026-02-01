import { Pipe, PipeTransform } from '@angular/core';
import { OrderState } from '@menno/types';

@Pipe({
  name: 'orderState',
  standalone: true,
})
export class OrderStatePipe implements PipeTransform {
  transform(value?: OrderState): string {
    if (value === undefined || value === null) return '';
    switch (value) {
      case OrderState.Pending:
        return 'در انتظار';
      case OrderState.Processing:
        return 'در حال آماده‌سازی';
      case OrderState.Shipping:
        return 'در حال ارسال';
      case OrderState.Ready:
        return 'آماده تحویل';
      case OrderState.Completed:
        return 'تکمیل شده';
      case OrderState.Canceled:
        return 'لغو شده';
      default:
        return (value as any)?.toString() || '';
    }
  }
}

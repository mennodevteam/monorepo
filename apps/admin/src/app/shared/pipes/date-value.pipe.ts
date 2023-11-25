import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateValue',
})
export class DateValuePipe implements PipeTransform {
  transform(value: Date): number {
    if (!value) return 0;
    return new Date(value || 0).valueOf();
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { PersianNumberService } from '@menno/utils';

@Pipe({
  name: 'phone',
})
export class PhonePipe implements PipeTransform {
  transform(value: string): unknown {
    try {
      value = PersianNumberService.toEnglish(value);
      value = value.replace(' ', '');
      value = value.trim();
      value = value.replace('+98', '0');
      if (value.length === 10 && value[0] === '9') {
        value = `0${value}`;
      }
      return value;
    } catch (error) {
      return value;
    }
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pdate',
  standalone: true,
})
export class PdatePipe implements PipeTransform {
  transform(value?: Date | string): string {
    if (value) {
      const date = new Date(value);
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return formatter.format(date);
    }
    return '';
  }
}

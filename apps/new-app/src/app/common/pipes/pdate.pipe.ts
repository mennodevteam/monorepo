import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pdate',
  standalone: true,
})
export class PdatePipe implements PipeTransform {
  transform(value?: Date | string, showTime?: boolean): string {
    if (value) {
      const date = new Date(value);
      if (showTime) {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });
        return formatter.format(date);
      } else {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        return formatter.format(date);
      }
    }
    return '';
  }
}

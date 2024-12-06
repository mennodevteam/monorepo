import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pdate',
  standalone: true,
})
export class PdatePipe implements PipeTransform {
  transform(value?: Date | string, time?: boolean): string {
    if (value) {
      const date = new Date(value);
      if (time) {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        });
        return formatter.format(date);
      } else {
        const formatter = new Intl.DateTimeFormat('fa-IR', {
          day: 'numeric',
          month: 'long',
          year: '2-digit',
        });
        return formatter.format(date);
      }
    }
    return '';
  }
}

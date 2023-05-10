import { Pipe, PipeTransform } from '@angular/core';

declare let persianDate: any;

@Pipe({
  name: 'pdate'
})
export class PdatePipe implements PipeTransform {

  transform(date: any, format?: string): any {
    try {
      date = new Date(date);
      if (!format) {
        format = 'D MMMM HH:mm';
      }

      const pdate = new persianDate(date);
      return pdate.format(format);
    } catch (error) {
      return null;
    }
  }

}

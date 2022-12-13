import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

declare var persianDate: any;

@Pipe({
  name: 'pdate'
})
export class PdatePipe implements PipeTransform {
  constructor(private translate: TranslateService,) { }

  transform(date: any, format?: string): any {
    try {
      date = new Date(date);
      if (!format) {
        format = 'YYYY/MM/DD - HH:mm';
      }

      const pdate = new persianDate(date);
      if (this.translate.currentLang === 'en' || this.translate.defaultLang === 'en') {
        pdate.toCalendar('gregorian');
        pdate.toLocale('en');
      }
      return pdate.format(format);
    } catch (error) {
      return null;
    }
  }

}

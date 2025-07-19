import { Pipe, PipeTransform } from '@angular/core';
import { BusinessCategory } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'businessCategory',
})
export class BusinessCategoryPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(type: BusinessCategory): unknown {
    return this.translate.instant('shopBusinessCategory.' + type);
  }
}

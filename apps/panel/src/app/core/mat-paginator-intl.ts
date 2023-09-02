import { MatPaginatorIntl } from '@angular/material/paginator';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class PaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();

    this.getAndInitTranslations();
  }

  getAndInitTranslations() {
    this.translate.get('app.ok').subscribe((x) => {
      this.itemsPerPageLabel = this.translate.instant('paginator.itemsPerPageLabel');
      this.nextPageLabel = this.translate.instant('paginator.nextPageLabel');
      this.previousPageLabel = this.translate.instant('paginator.previousPageLabel');
      this.lastPageLabel = this.translate.instant('paginator.lastPageLabel');
      this.firstPageLabel = this.translate.instant('paginator.firstPageLabel');
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    return this.translate.instant('paginator.rangeLabel', {
      page: page + 1,
      total: Math.floor(length / pageSize) + 1,
    });
  }
}

import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../api-error';

const API_PATH = 'shops';

@Injectable({
  providedIn: 'root',
})
export class ShopsService {
  private shops$ = new BehaviorSubject<Shop[] | null>(null);
  private _loading = false;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    this.load();
  }

  async load() {
    try {
      this._loading = true;
      const shops = await this.http.get<Shop[]>(API_PATH).toPromise();
      if (shops) {
        this.shops$.next(shops);
      }
    } finally {
      this._loading = false;
    }
  }

  get shopsObservable() {
    if (!this.shops && !this._loading) this.load();
    return this.shops$.asObservable();
  }

  get shops() {
    return this.shops$.value;
  }

  migrateFromPrev() {
    this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('migrateDialog.title'),
          description: this.translate.instant('migrateDialog.description'),
          label: this.translate.instant('migrateDialog.label'),
        },
      })
      .afterClosed()
      .subscribe(async (code) => {
        if (code) {
          this.snack.open(this.translate.instant('migrateDialog.loading'), '', { duration: 0 });
          try {
            const d = await this.http.get(`${API_PATH}/createNewFromPrev/${code}`).toPromise();
            this.load();
            this.snack.open(this.translate.instant('migrateDialog.success'));
          } catch (error: any) {
            if (error.status === HttpStatusCode.Conflict)
              this.snack.open(this.translate.instant('migrateDialog.conflictError'));
            else this.snack.open(this.translate.instant('app.serverError'));
          }
        }
      });
  }
}

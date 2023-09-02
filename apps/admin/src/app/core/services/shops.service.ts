import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateShopDto, Plugin, Region, Shop } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { ApiError } from '../api-error';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';

const API_PATH = 'shops';

@Injectable({
  providedIn: 'root',
})
export class ShopsService {
  private shops$ = new BehaviorSubject<Shop[] | null>(null);
  regions: Region[];
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
    this.http.get<Region[]>('regions').subscribe((regions) => {
      this.regions = regions;
    });
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

  create(dto?: CreateShopDto) {
    const fields: PromptKeyFields = {
      title: {
        control: new FormControl(dto?.title, Validators.required),
        label: this.translate.instant('createShopDialog.titleLabel'),
      },
      firstName: {
        control: new FormControl(dto?.firstName, Validators.required),
        label: this.translate.instant('createShopDialog.firstNameLabel'),
      },
      lastName: {
        control: new FormControl(dto?.lastName, Validators.required),
        label: this.translate.instant('createShopDialog.lastNameLabel'),
      },
      mobilePhone: {
        control: new FormControl(dto?.mobilePhone, Validators.required),
        label: this.translate.instant('createShopDialog.mobilePhoneLabel'),
      },
      username: {
        control: new FormControl(dto?.username, Validators.required),
        label: this.translate.instant('createShopDialog.usernameLabel'),
        ltr: true,
      },
      loginUsername: {
        control: new FormControl(dto?.loginUsername, Validators.required),
        label: this.translate.instant('createShopDialog.loginUsernameLabel'),
        ltr: true,
      },
      loginPassword: {
        control: new FormControl(dto?.loginPassword, Validators.required),
        label: this.translate.instant('createShopDialog.loginPasswordLabel'),
        ltr: true,
      },
      plugins: {
        control: new FormControl(dto?.plugins, Validators.required),
        label: this.translate.instant('createShopDialog.pluginsLabel'),
        type: 'multiple',
        options: [
          { value: Plugin.Menu, text: 'Menu' },
          { value: Plugin.Ordering, text: 'Ordering' },
          { value: Plugin.Club, text: 'Club' },
        ],
      },
      expiredAt: {
        control: new FormControl(dto?.expiredAt, Validators.required),
        label: this.translate.instant('createShopDialog.expiredAtLabel'),
        type: 'datepicker',
      },
      regionId: {
        control: new FormControl(dto?.regionId),
        label: this.translate.instant('createShopDialog.regionIdLabel'),
        type: 'select',
        options: this.regions.map((x) => ({ text: x.title, value: x.id })),
      },
      regionTitle: {
        control: new FormControl(dto?.regionTitle),
        label: this.translate.instant('createShopDialog.regionTitleLabel'),
      },
    };
    this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          title: this.translate.instant('createShopDialog.title'),
          fields,
        },
      })
      .afterClosed()
      .subscribe((dto: CreateShopDto) => {
        if (dto) {
          this.http.post<Shop>(API_PATH, dto).subscribe(
            (shop) => {
              this.load();
            },
            (err) => {
              this.create(dto);
            }
          );
        }
      });
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

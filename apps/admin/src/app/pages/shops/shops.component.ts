import { ChangeDetectorRef, Component } from '@angular/core';
import { ShopsService } from '../../core/services/shops.service';
import { NewSmsDto, Plugin, Shop, Sms, User } from '@menno/types';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { SmsService } from '../../core/services/sms.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'menno-shops',
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.scss'],
})
export class ShopsComponent {
  dataSource = new MatTableDataSource<Shop>();
  columns = [
    'index',
    'image',
    'code',
    'id',
    'title',
    'plugins',
    'expiredAt',
    'manager',
    'phone',
    'username',
    'password',
    'connectionAt',
    'createdAt',
    'actions',
  ];
  Plugin = Plugin;
  Shop = Shop;
  User = User;
  now = new Date();

  constructor(
    public shopsService: ShopsService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private translate: TranslateService,
    private smsService: SmsService,
    private snack: MatSnackBar
  ) {
    if (this.shops) {
      this.dataSource = new MatTableDataSource(this.shops);
      // this.cdr.detectChanges();
    }
    this.shopsService.shopsObservable.subscribe((shops) => {
      if (shops) this.dataSource = new MatTableDataSource(shops);
    });
  }

  get shops() {
    return this.shopsService.shops;
  }

  get panelLink() {
    return environment.panelLoginLink;
  }

  get origin() {
    return environment.appOrigin;
  }

  sortChanged(ev: Sort) {
    if (this.shops) {
      switch (ev.active) {
        case 'code':
          this.dataSource = new MatTableDataSource(
            this.shops.sort((a, b) => (Number(a.code) - Number(b.code)) * (ev.direction === 'desc' ? -1 : 1))
          );
          break;
        case 'createdAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        case 'connectionAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.connectionAt).valueOf() - new Date(b.connectionAt).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        case 'expiredAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.plugins?.expiredAt || 0).valueOf() -
                  new Date(b.plugins?.expiredAt || 0).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        default:
          break;
      }
    }
  }

  sendSms(shop?: Shop) {
    const dto = new NewSmsDto();
    this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant(shop ? 'smsDialog.title' : 'smsDialog.titleAll', {
            value: shop?.title,
          }),
          label: this.translate.instant('smsDialog.label'),
          type: 'textarea',
          rows: 6
        },
      })
      .afterClosed()
      .subscribe((value) => {
        if (value) {
          if (shop) {
            dto.receptors = [shop.users[0].user.mobilePhone];
            dto.messages = [value];
            this.smsService.send(dto).then((sms: Sms[] | undefined) => {
              if (sms) {
                this.snack.open(this.translate.instant('smsDialog.success', { value: sms.length }), '', {
                  panelClass: 'success',
                });
              }
            });
          }
        }
      });
  }
}

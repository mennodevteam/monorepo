import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwPush } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { ShopTable } from '@menno/types';
import { LocalNotificationsService } from './local-notifications.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root'
})
export class DingService {

  constructor(
    private swPush: SwPush,
    private dialog: MatDialog,
    private shop: ShopService,
    private translate: TranslateService,
    private localNotifications: LocalNotificationsService,
  ) {
    console.log('init ding');
    console.log(swPush.messages);
    this.swPush.messages.subscribe((message: any) => {
      try {
        if (message.notification.data.ding) {
          let table: ShopTable;
          try {
            table = shop.instant.details.tables.find(x => x.code === message.notification.data.ding.tableCode);
          } catch (error) { }
          this.localNotifications.add({
            title: this.translate.instant('dingDialog.title', {
              value: (table ? `${table.code} ${table.title || ''}` : message.notification.data.ding.tableCode)
            }),
            contents: [message.notification.data.ding.tableCode],
            createdAt: new Date(message.notification.data.ding.createdAt),
            soundIndex: 0,
            lifetime: 120000,
          });
        }
      } catch (error) { }
    });
  }
}

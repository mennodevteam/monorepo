import { Component } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import { Plugin } from '@menno/types';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { PersianNumberService } from '@menno/utils';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { PUBLIC_URLS } from '../../core/public-urls.consts';
import { PayService } from '../../core/services/pay.service';
import { WebPushNotificationsService } from '../../core/services/web-push-notifications.service';
import { ExtendPluginsModalComponent } from '../../shared/components/extend-plugins-modal/extend-plugins-modal.component';
import { environment } from 'apps/panel/src/environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  Plugin = Plugin;
  remainingDays: number;
  totalDays: number;
  PUBLIC_URLS = PUBLIC_URLS;
  avgSmsCharge = 3 * 44;
  redirectingChargeSms = false;
  env = environment;

  update = {
    date: new Date(2024, 8, 29),
    items: [
      { title: 'امکان ثبت‌نام مجموعه‌های فروشگاهی (غیر رستورانی)', type: 'feature' },
      { title: 'امکان مشخص کردن لزوم دریافت اطلاعات پستی برای مجموعه‌های فروشگاهی', type: 'feature' },
      { title: 'ورژن ۲ اپ مشتری با دیزاین جدید', type: 'feature' },
      { title: 'حل مشکل عدم نمایش صحیح لیست سفارشات', type: 'bug' },
    ],
  };

  constructor(
    public shopService: ShopService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private snack: MatSnackBar,
    private payService: PayService,
    public webPush: WebPushNotificationsService,
    private analytics: AnalyticsService,
  ) {
    const fromDate = new Date(this.plugin?.renewAt || 0).valueOf();
    const toDate = new Date(this.plugin?.expiredAt || 0).valueOf();
    this.remainingDays = Math.max(0, (toDate - Date.now()) / 3600000 / 24);
    this.totalDays = Math.max(0, (toDate - fromDate) / 3600000 / 24);
  }

  get shop() {
    return this.shopService.shop!;
  }

  get plugin() {
    return this.shop.plugins;
  }

  renew() {
    this.dialog.open(ExtendPluginsModalComponent, {
      // data: {
      //   title: this.translate.instant('home.renewAction'),
      //   description: this.translate.instant('home.renewActionDescription'),
      //   hideCancel: true,
      //   ok: this.translate.instant('app.ok'),
      // },
    });
  }

  openApp() {
    window.open(this.appLink, this.shop.title, 'width=400,height=700');
  }

  get appLink() {
    return this.shopService.appLink;
  }

  async sendLink() {
    let phone: string = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('sendShopLink.dialogTitle'),
          description: this.translate.instant('sendShopLink.dialogDescription'),
          label: this.translate.instant('sendShopLink.dialogLabel'),
          placeholder: this.translate.instant('sendShopLink.dialogPlaceholder'),
        },
      })
      .afterClosed()
      .toPromise();
    let engPhone = PersianNumberService.toEnglish(phone);
    if (engPhone && engPhone.length === 10 && engPhone[0] === '9') engPhone = '0' + engPhone;
    if (engPhone && engPhone.length == 11 && engPhone.search('09') === 0) {
      await this.shopService.smsLink(engPhone);
      this.analytics.event('send sms link', { eventLabel: engPhone });
      this.snack.open(this.translate.instant('sendShopLink.sentSuccess'), '', { panelClass: 'success' });
    } else {
      this.snack.open(this.translate.instant('sendShopLink.numberError'), '', { panelClass: 'warning' });
    }
  }

  async chargeSmsAccount() {
    const amount: number = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('home.chargeDialogTitle'),
          description: this.translate.instant('home.chargeDialogDescription'),
          label: this.translate.instant('home.chargeDialogLabel'),
          hint: this.translate.instant('app.currency'),
          type: 'number',
        },
      })
      .afterClosed()
      .toPromise();
    if (amount >= 1000) {
      this.redirectingChargeSms = true;
      this.analytics.event('charge sms account go to bank', { eventValue: amount });
      this.payService.redirect('chargeSmsAccount', amount);
    }
  }
}

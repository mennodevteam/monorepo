import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { ShopService } from '../core/services/shop.service';
import { TodayOrdersService } from '../core/services/today-orders.service';
import { RegionsService } from '../core/services/regions.service';
import { UpdateService } from '../core/services/update.service';
import { WebPushNotificationsService } from '../core/services/web-push-notifications.service';
import { DingService } from '../core/services/ding.service';
import { PromptDialogComponent } from '../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { PersianNumberService } from '@menno/utils';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClubService } from '../core/services/club.service';
import { GoftinoService } from '../core/services/goftino.service';
import { bounceIn } from '../core/animations/bounce.animation';

@Component({
  selector: 'menno-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
  animations: [
    bounceIn('0.2s 1s')
  ]
})
export class PagesComponent implements OnInit {
  isHandset$: Observable<boolean>;

  constructor(
    private regions: RegionsService,
    public shopService: ShopService,
    private breakpointObserver: BreakpointObserver,
    public translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    public todayOrders: TodayOrdersService,
    private updateService: UpdateService,
    private notif: WebPushNotificationsService,
    private dingService: DingService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private translate: TranslateService,
    public club: ClubService,
    private goftino: GoftinoService,
  ) {
    this.isHandset$ = this.breakpointObserver.observe('(max-width: 1024px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );
  }

  ngOnInit(): void {}

  get shop() {
    return this.shopService.shop;
  }

  getRouteData(route = this.route): any {
    if (!route) return {};
    let data = {};
    if (route.snapshot?.data && Object.keys(route.snapshot?.data).length > 0) {
      data = { ...data, ...route.snapshot?.data };
    }
    const child = route.firstChild;
    if (child) {
      data = { ...data, ...this.getRouteData(child) };
    }
    return data;
  }

  get isClubDisabled() {
    return !this.shop?.club;
  }

  logout() {
    this.auth.logout();
    window.location.reload();
  }

  openApp() {
    window.open(this.shopService.appLink, this.shopService.shop?.title, 'width=400,height=700');
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
      this.snack.open(this.translate.instant('sendShopLink.sentSuccess'), '', { panelClass: 'success' });
    } else {
      this.snack.open(this.translate.instant('sendShopLink.numberError'), '', { panelClass: 'warning' });
    }
  }
}

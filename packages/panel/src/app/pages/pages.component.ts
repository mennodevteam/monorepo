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

@Component({
  selector: 'menno-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
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
}

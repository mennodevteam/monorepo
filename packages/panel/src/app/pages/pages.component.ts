import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { ShopService } from '../core/services/shop.service';

@Component({
  selector: 'menno-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
})
export class PagesComponent implements OnInit {
  isHandset$: Observable<boolean>;

  constructor(
    public shopService: ShopService,
    private breakpointObserver: BreakpointObserver,
    public translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
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

  logout() {
    this.auth.logout();
    window.location.reload();
  }
}

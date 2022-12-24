import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, shareReplay } from 'rxjs';
import { ShopService } from '../core/services/shop.service';
import { ITEMS } from './sidebar.constant';

@Component({
  selector: 'menno-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
})
export class PagesComponent implements OnInit {
  items = ITEMS;
  isHandset$: Observable<boolean>;

  constructor(
    public shopService: ShopService,
    private breakpointObserver: BreakpointObserver,
    public translateService: TranslateService
  ) {
    this.isHandset$ = this.breakpointObserver.observe('(max-width: 1024px)').pipe(
      map((result) => result.matches),
      shareReplay()
    );
  }

  ngOnInit(): void {}
}

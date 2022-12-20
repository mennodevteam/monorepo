import { Component, OnInit } from '@angular/core';
import { ShopService } from '../core/services/shop.service';
import { ITEMS } from './sidebar.constant';

@Component({
  selector: 'menno-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
})
export class PagesComponent implements OnInit {
  items = ITEMS;
  constructor(
    public shopService: ShopService,
  ) {}

  ngOnInit(): void {}
}

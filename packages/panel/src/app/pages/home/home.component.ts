import { Component } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import { Plugin } from '@menno/types';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  Plugin = Plugin;
  constructor(private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop!;
  }

  get plugin() {
    return this.shop.plugins;
  }

  get remainingDays() {
    const toDate = new Date(this.plugin?.expiredAt || 0).valueOf();
    const days = (toDate - Date.now()) / 3600000 / 24;
    return Math.max(0, days);
  }

  get totalDays() {
    const fromDate = new Date(this.plugin?.renewAt || 0).valueOf();
    const toDate = new Date(this.plugin?.expiredAt || 0).valueOf();
    const days = (toDate - fromDate) / 3600000 / 24;
    return Math.max(0, days);
  }
}

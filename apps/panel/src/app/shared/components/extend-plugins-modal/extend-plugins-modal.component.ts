import { Component } from '@angular/core';
import { Plugin } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';
import { PayService } from '../../../core/services/pay.service';

@Component({
  selector: 'menno-extend-plugins-modal',
  templateUrl: './extend-plugins-modal.component.html',
  styleUrls: ['./extend-plugins-modal.component.scss'],
})
export class ExtendPluginsModalComponent {
  selected: number;
  isMonthly = false;
  loading = false;

  constructor(private shopService: ShopService, private payService: PayService) {}

  get plugin() {
    return this.shopService.shop?.plugins;
  }

  get unavailable() {
    return false
    const expiredAt = new Date(this.shopService.shop?.plugins?.expiredAt || 0);
    return expiredAt.valueOf() - Date.now() > 9 * 24 * 3600000;
  }

  pay() {
    let plugins: Plugin[] = [];
    if (this.selected === 1) plugins = [Plugin.Menu];
    if (this.selected === 2) plugins = [Plugin.Menu, Plugin.Ordering];
    if (this.selected === 3) plugins = [Plugin.Menu, Plugin.Ordering, Plugin.Club];
    this.loading = true;
    this.payService.redirect(`extendPlugin`, undefined, {
      isMonthly: this.isMonthly,
      plugins,
    });
  }
}

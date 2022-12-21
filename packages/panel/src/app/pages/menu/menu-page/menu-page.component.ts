import { Component } from '@angular/core';
import { map } from 'rxjs';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'menno-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent {
  constructor(private shopService: ShopService) {}

  get categories() {
    return this.shopService.shop.pipe(map((x) => x?.menu?.categories));
  }
}

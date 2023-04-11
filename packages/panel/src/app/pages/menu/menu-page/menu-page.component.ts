import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'menno-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent {
  constructor(private menuService: MenuService) {}

  get categories() {
    return this.menuService.menu?.categories;
  }
}

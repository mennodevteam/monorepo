import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { COMMON } from '../..';
import { MenuService, PwaService, ShopService } from '../../../core';

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, COMMON],
  templateUrl: './top-app-bar.component.html',
  styleUrl: './top-app-bar.component.scss',
})
export class TopAppBarComponent {
  @Input() title?: string;
  @Input() hideMenu?: boolean;
  @Input() showActions?: boolean;
  @Input() sticky = false;

  constructor(
    private shopService: ShopService,
    public pwa: PwaService,
    public menuService: MenuService
  ) {}

  get shop() {
    return this.shopService.shop;
  }

  get canShare() {
    return 'share' in navigator;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Shop } from '@menno/types';
import { MatButtonModule } from '@angular/material/button';
import { COMMON } from '../..';
import { ShopService } from '../../../core';

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
  @Input() sticky = false;

  constructor(private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop;
  }
}

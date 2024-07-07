import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../common/components';
import { ShopService } from '../core';
import { HeaderComponent } from './header/header.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { COMMON } from '../common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, TopAppBarComponent, HeaderComponent, COMMON],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  constructor(private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop!;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, ShopService } from '../../core';
import { MatButtonModule } from '@angular/material/button';
import { SliderComponent } from './slider/slider.component';
import { COMMON } from '../../common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatButtonModule, SliderComponent, COMMON],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  constructor(
    public shopService: ShopService,
    public menuService: MenuService,
  ) {}

  get shop() {
    return this.shopService.shop!;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../common/components';
import { MenuService, ShopService, flyInOutFromDown } from '../core';
import { HeaderComponent } from './header/header.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { COMMON } from '../common';
import { CategoryCarouselComponent } from './category-carousel/category-carousel.component';
import { CategorySectionComponent } from './category-section/category-section.component';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    TopAppBarComponent,
    HeaderComponent,
    COMMON,
    CategoryCarouselComponent,
    CategorySectionComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  animations: [flyInOutFromDown()],
})
export class MenuComponent {
  constructor(
    private shopService: ShopService,
    public menuService: MenuService,
    public cart: CartService,
  ) {}

  get shop() {
    return this.shopService.shop;
  }
}

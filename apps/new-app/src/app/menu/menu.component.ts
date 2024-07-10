import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../common/components';
import { MenuService, ShopService } from '../core';
import { HeaderComponent } from './header/header.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { COMMON } from '../common';
import { CategoryCarouselComponent } from './category-carousel/category-carousel.component';
import { CategorySectionComponent } from './category-section/category-section.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, TopAppBarComponent, HeaderComponent, COMMON, CategoryCarouselComponent, CategorySectionComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  constructor(private shopService: ShopService, public menuService: MenuService) {}

  get shop() {
    return this.shopService.shop;
  }

}

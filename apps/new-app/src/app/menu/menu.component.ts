import { Component, ElementRef, ViewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../common/components';
import { MenuService, ShopService, flyInOutFromDown } from '../core';
import { HeaderComponent } from './header/header.component';
import { COMMON } from '../common';
import { CategoryCarouselComponent } from './category-carousel/category-carousel.component';
import { CategorySectionComponent } from './category-section/category-section.component';
import { CartService } from '../core/services/cart.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FooterComponent } from '../common/components/footer/footer.component';

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
    MatToolbarModule,
    ReactiveFormsModule,
    FooterComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  animations: [flyInOutFromDown()],
})
export class MenuComponent {
  @ViewChild('searchbox') searchboxInput: ElementRef;
  searchControl = new FormControl(this.menuService.searchText());
  searching = signal(!!this.menuService.searchText());
  constructor(
    private shopService: ShopService,
    public menuService: MenuService,
    public cart: CartService,
  ) {
    effect(() => {
      if (this.searching()) {
        setTimeout(() => {
          this.searchboxInput.nativeElement.focus();
        }, 100);
      } else {
        this.searchControl.setValue('');
      }
    });

    this.searchControl.valueChanges.subscribe((value) => {
      this.menuService.searchText.set(value || '');
    });
  }

  get shop() {
    return this.shopService.shop;
  }
}

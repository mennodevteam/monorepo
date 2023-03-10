import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MenuViewType } from '@menno/types';
import { BehaviorSubject, debounceTime } from 'rxjs';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { MenuCategoriesComponent } from './menu-categories/menu-categories.component';

@Component({
  selector: 'menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent implements AfterViewInit {
  @ViewChildren('category') categoryElements: QueryList<ElementRef>;
  @ViewChild(MenuCategoriesComponent)
  menuCategoriesComponent: MenuCategoriesComponent;
  MenuViewType = MenuViewType;
  viewType: MenuViewType;

  constructor(
    private menuService: MenuService,
    public basket: BasketService,
    private shopService: ShopService
  ) {
    this.menuService.checkSelectedOrderType();

    // this.onScrollMenu.pipe(debounceTime(200)).subscribe(() => {
    //   const selectedCatElem = this.categoryElements.reduce((a, b) => {
    //     const aView = this.elementViewportCapacity(a);
    //     const bView = this.elementViewportCapacity(b);
    //     if (aView > bView) return a;
    //     return b;
    //   }, this.categoryElements.first);

    //   const selectedIndex = this.categoryElements.toArray().indexOf(selectedCatElem);

    //   if (selectedIndex > -1) {
    //     this.menuCategoriesComponent.selectChip(selectedIndex);
    //   }
    // });

    if (this.menu) {
      this.viewType =
        this.appConfig?.menuViewType === MenuViewType.Manual
          ? MenuViewType.Card
          : this.appConfig?.menuViewType || MenuViewType.Card;
    }
  }

  ngAfterViewInit(): void {
    for (const cat of this.categoryElements) {
      const topMargin = 60 + 120;
      const bottomMargin = window.innerHeight - topMargin - 120;
      const rootMargin = `-${topMargin}px 0px -${bottomMargin}px 0px`;
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0 && entry.isIntersecting) {
              const selectedIndex = this.categoryElements.toArray().indexOf(cat);
              this.menuCategoriesComponent.selectChip(selectedIndex, true);
            }
          });
        },
        {
          root: null,
          rootMargin,
        }
      ).observe(cat.nativeElement);
    }
  }

  get shop() {
    return this.shopService.shop;
  }

  get appConfig() {
    return this.shopService.shop?.appConfig;
  }

  get menu() {
    return this.menuService.menu;
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  categoryClick(index: number) {
    this.categoryElements.toArray()[index].nativeElement.scrollIntoView(true);
  }

  toggleView() {
    if (this.viewType === MenuViewType.Card) this.viewType = MenuViewType.Grid;
    else if (this.viewType === MenuViewType.Grid) this.viewType = MenuViewType.Card;
  }
}

import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Menu, MenuViewType } from '@menno/types';
import { BehaviorSubject, debounceTime, map } from 'rxjs';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { MenuCategoriesComponent } from './menu-categories/menu-categories.component';

@Component({
  selector: 'menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent {
  private onScrollMenu = new BehaviorSubject(0);
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
    this.onScrollMenu.pipe(debounceTime(200)).subscribe(() => {
      const selectedCatElem = this.categoryElements.reduce((a, b) => {
        const aView = this.elementViewportCapacity(a);
        const bView = this.elementViewportCapacity(b);
        if (aView > bView) return a;
        return b;
      }, this.categoryElements.first);

      const selectedIndex = this.categoryElements.toArray().indexOf(selectedCatElem);

      if (selectedIndex > -1) {
        this.menuCategoriesComponent.selectChip(selectedIndex);
      }
    });

    if (this.menu) {
      this.viewType =
        this.appConfig?.menuViewType === MenuViewType.Manual
          ? MenuViewType.Card
          : this.appConfig?.menuViewType || MenuViewType.Card;
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

  @HostListener('window:scroll', ['$event']) onScrollEvent(ev: Event) {
    this.onScrollMenu.next(0);
  }

  elementViewportCapacity(element: ElementRef) {
    const viewportHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const elementOffsetTop = element.nativeElement.offsetTop;
    const elementHeight = element.nativeElement.offsetHeight;

    const bottom = Math.min(elementOffsetTop + elementHeight, scrollTop + viewportHeight);
    const top = Math.max(elementOffsetTop, scrollTop);
    const res = bottom - top;
    return res;
    // Calculate percentage of the element that's been seen
    const distance = scrollTop + viewportHeight - elementOffsetTop;
    const percentage = Math.round(distance / ((viewportHeight + elementHeight) / 100));

    // Restrict the range to between 0 and 100
    return Math.min(100, Math.max(0, percentage));
  }

  categoryClick(index: number) {
    this.categoryElements.toArray()[index].nativeElement.scrollIntoView(true);
  }

  toggleView() {
    if (this.viewType === MenuViewType.Card) this.viewType = MenuViewType.Grid;
    else if (this.viewType === MenuViewType.Grid) this.viewType = MenuViewType.Card;
  }
}

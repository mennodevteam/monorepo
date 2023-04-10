import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DELIVERY_COST_TITLE, MenuViewType, OrderType, ShopTable, Status } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { MenuCategoriesComponent } from './menu-categories/menu-categories.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LocationEditBottomSheetComponent } from '../location-edit-bottom-sheet/location-edit-bottom-sheet.component';
import { LocationsBottomSheetComponent } from '../locations-bottom-sheet/locations-bottom-sheet.component';
import { ShopTablesBottomSheetComponent } from '../shop-tables-bottom-sheet/shop-tables-bottom-sheet.component';

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
  OrderType = OrderType;
  Status = Status;

  constructor(
    private menuService: MenuService,
    public basket: BasketService,
    private shopService: ShopService,
    private bottomSheet: MatBottomSheet
  ) {
    this.menuService.checkSelectedOrderType();

    if (this.menu) {
      this.viewType =
        this.appConfig?.menuViewType === MenuViewType.Manual
          ? MenuViewType.Card
          : this.appConfig?.menuViewType || MenuViewType.Card;
    }

    this.menuService.typeObservable.subscribe((type) => {
      if (type === OrderType.DineIn && !this.basket.details?.table && this.shop?.details?.tables?.length) {
        this.selectDineInTable();
      } else if (type === OrderType.Delivery && !this.basket.address) {
        this.selectDeliveryAddress();
      }
    });
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

  get orderType() {
    return this.menuService.type;
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

  get tables() {
    return this.shop?.details.tables;
  }

  categoryClick(index: number) {
    this.categoryElements.toArray()[index].nativeElement.scrollIntoView(true);
  }

  toggleView() {
    if (this.viewType === MenuViewType.Card) this.viewType = MenuViewType.Grid;
    else if (this.viewType === MenuViewType.Grid) this.viewType = MenuViewType.Card;
  }

  changeType() {
    this.menuService.openSelectOrderType();
  }

  async selectDeliveryAddress() {
    let address = await this.bottomSheet.open(LocationsBottomSheetComponent).afterDismissed().toPromise();
    if (address === null) {
      address = await this.bottomSheet
        .open(LocationEditBottomSheetComponent, {
          data: { shop: this.shop },
        })
        .afterDismissed()
        .toPromise();
    }
    if (address) {
      this.basket.address = address;
    }
  }

  get deliveryCost() {
    return this.basket.abstractItems.find((x) => x.title === DELIVERY_COST_TITLE);
  }

  selectDineInTable() {
    this.bottomSheet
      .open(ShopTablesBottomSheetComponent)
      .afterDismissed()
      .subscribe((table?: ShopTable) => {
        if (table) {
          let tableText = table.code;
          if (table.title) tableText += ` (${table.title})`;
          this.basket.details = { ...this.basket.details, table: tableText };
        }
      });
  }
}

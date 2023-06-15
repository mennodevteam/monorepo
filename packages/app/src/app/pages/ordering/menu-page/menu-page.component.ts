import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
  DELIVERY_COST_TITLE,
  Menu,
  MenuViewType,
  OrderType,
  ProductCategory,
  ShopTable,
  Status,
} from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { MenuCategoriesComponent } from './menu-categories/menu-categories.component';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LocationEditBottomSheetComponent } from '../location-edit-bottom-sheet/location-edit-bottom-sheet.component';
import { LocationsBottomSheetComponent } from '../locations-bottom-sheet/locations-bottom-sheet.component';
import { ShopTablesBottomSheetComponent } from '../shop-tables-bottom-sheet/shop-tables-bottom-sheet.component';
import { FormControl } from '@angular/forms';
import { DingBottomSheetComponent } from '../ding-bottom-sheet/ding-bottom-sheet.component';

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
  OrderType = OrderType;
  Status = Status;
  searchQueryControl = new FormControl();
  showSelectOrderType = true;
  private _viewType: MenuViewType;

  searchCategories: ProductCategory[] = [];

  constructor(
    public menuService: MenuService,
    public basket: BasketService,
    private shopService: ShopService,
    private bottomSheet: MatBottomSheet
  ) {
    this.menuService.checkSelectedOrderType();

    if (this.menu && this.viewType === undefined) {
      if (!this.appConfig || this.appConfig.menuViewType === MenuViewType.Manual) {
        const localViewType = localStorage.getItem('ui-menuViewType');
        this.viewType = localViewType ? Number(localViewType) : MenuViewType.Card;
      } else {
        this.viewType = this.appConfig.menuViewType;
      }
    }

    this.menuService.typeObservable.subscribe((type) => {
      if (
        type === OrderType.DineIn &&
        !this.basket.details?.table &&
        this.tables?.length &&
        !this.shop?.appConfig?.disableOrdering
      ) {
        this.selectDineInTable();
      } else if (
        type === OrderType.Delivery &&
        !this.basket.address &&
        !this.shop?.appConfig?.disableOrdering
      ) {
        this.selectDeliveryAddress();
      }

      setTimeout(() => {
        this.setScrolling();
      }, 1000);

      this.searchQueryControl.valueChanges.subscribe((value) => {
        this.searchCategories = [];
        if (this.menu) {
          this.searchCategories = Menu.search(this.menu, value);
        }
      });
    });

    if (this.appConfig?.disableOrdering && this.menu && !Menu.isBasedOrderType(this.menu)) {
      this.showSelectOrderType = false;
    }
  }

  ngAfterViewInit(): void {
    this.setScrolling();
  }

  get viewType() {
    return this._viewType;
  }

  set viewType(val: MenuViewType) {
    this._viewType = val;
    localStorage.setItem('ui-menuViewType', val.toString());
  }

  setScrolling() {
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
    return this.shop?.details?.tables;
  }

  categoryClick(index: number) {
    this.categoryElements.toArray()[index].nativeElement.scrollIntoView(true);
  }

  toggleView() {
    if (this.viewType === MenuViewType.Card) this.viewType = MenuViewType.Grid;
    else if (this.viewType === MenuViewType.Grid) this.viewType = MenuViewType.Compact;
    else if (this.viewType === MenuViewType.Compact) this.viewType = MenuViewType.Card;
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
          const tableText = table.code;
          this.basket.details = { ...this.basket.details, table: tableText };
        }
      });
  }

  async ding() {
    if (this.basket.details?.table) {
      let description = '';
      if (this.appConfig?.dings?.length) {
        description = await this.bottomSheet.open(DingBottomSheetComponent).afterDismissed().toPromise();
        if (!description) return;
      }
      this.shopService.ding(this.basket.details?.table, description);
    }
  }

  get dingTimer() {
    return this.shopService.dingTimer;
  }

  get isClosed() {
    return !this.shopService.isOpen;
  }
}

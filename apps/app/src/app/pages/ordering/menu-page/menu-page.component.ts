import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
  DELIVERY_COST_TITLE,
  HomePage,
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
import { AuthService } from '../../../core/services/auth.service';
import { ShopInfoModalComponent } from '../shop-info-modal/shop-info-modal.component';

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
    private bottomSheet: MatBottomSheet,
    private auth: AuthService
  ) {
    this.menuService.checkSelectedOrderType();

    if (this.menu && this.viewType === undefined) {
      if (!this.appConfig?.menuViewType) {
        const localViewType = localStorage.getItem('ui-menuViewType');
        this.viewType = localViewType ? Number(localViewType) : MenuViewType.Grid;
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
      }

      this.searchQueryControl.valueChanges.subscribe((value) => {
        this.searchCategories = [];
        if (this.menu) {
          this.searchCategories = Menu.search(this.menu, value);
        }
      });
    });

    if (
      (this.appConfig?.disableOrdering && this.menu && !Menu.isBasedOrderType(this.menu)) ||
      this.appConfig?.selectableOrderTypes?.length === 1
    ) {
      this.showSelectOrderType = false;
    }
  }

  ngAfterViewInit(): void {}

  get viewType() {
    return this._viewType;
  }

  set viewType(val: MenuViewType) {
    this._viewType = val;
    localStorage.setItem('ui-menuViewType', val.toString());
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

  get showTableSelect() {
    return this.tables?.length && !this.shop?.appConfig?.disableOrdering && this.orderType === OrderType.DineIn
  }

  categoryClick(index: number) {
    this.categoryElements.toArray()[index].nativeElement.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }

  toggleView() {
    if (this.viewType === MenuViewType.Card) this.viewType = MenuViewType.Grid;
    else if (this.viewType === MenuViewType.Grid) this.viewType = MenuViewType.Compact;
    else if (this.viewType === MenuViewType.Compact) this.viewType = MenuViewType.Card;
  }

  async selectDeliveryAddress() {
    if (this.auth.isGuestUser) {
      const complete = await this.auth.openLoginPrompt();
      if (!complete) return;
    }
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

  get isHomePage() {
    return true
    return this.appConfig?.homePage === HomePage.Menu;
  }

  openShopInfoModal() {
    this.bottomSheet.open(ShopInfoModalComponent);
  }
}

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Menu, Order, OrderDto, OrderItem, OrderType, Product, ProductItem } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';

@Injectable({
  providedIn: 'root',
})
export class PosService extends OrderDto {
  saving = false;
  constructor(
    private menuService: MenuService,
    private orderService: OrdersService,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    super();
    this.clear();
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  setType(val: OrderType) {
    const menu = this.menuService.menu!;
    this.type = val;
    Menu.setRefsAndSort(menu, this.type, true);
  }

  plus(productId: string) {
    const product = this.menuService.getProductById(productId);
    if (product) {
      const item = this.productItems?.find((x) => x.productId === productId);
      if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
      else {
        const item: ProductItem = {
          productId: productId,
          quantity: 1,
        };
        if (!this.productItems) this.productItems = [];
        this.productItems.push(item);
        product._orderItem = item;
      }
    }
  }

  minus(productId: string) {
    const product = this.menuService.getProductById(productId);
    if (product) {
      const item = this.productItems?.find((x) => x.productId === product.id);
      if (item) {
        if (item.quantity > 1) item.quantity--;
        else {
          product._orderItem = undefined;
          this.productItems.splice(this.productItems.indexOf(item), 1);
        }
      }
    }
  }

  getItem(productId: string) {
    return this.productItems?.find((x) => x.productId === productId);
  }

  clear() {
    this.productItems = [];
    this.note = undefined;
    this.address = undefined;
    this.discountCoupon = undefined;
    this.type = OrderType.DineIn;
  }

  get items(): OrderItem[] {
    if (this.menuService.menu) {
      return OrderDto.productItems(this, this.menuService.menu);
    }
    return [];
  }

  get abstractItems(): OrderItem[] {
    if (this.menuService.menu) {
      return OrderDto.abstractItems(this, this.menuService.menu);
    }
    return [];
  }

  get sum() {
    if (this.menuService.menu) {
      return OrderDto.sum(this, this.menuService.menu);
    }
    return 0;
  }

  get total() {
    if (this.menuService.menu) {
      return OrderDto.total(this, this.menuService.menu);
    }
    return 0;
  }

  async save(print = false) {
    const dto: OrderDto = {
      productItems: this.productItems,
      type: this.type,
      details: this.details,
      manualCost: this.manualCost,
      manualDiscount: this.manualDiscount,
    } as OrderDto;
    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 3000 });
    await this.orderService.save(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.clear();
    this.saving = false;
  }
}

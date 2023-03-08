import { Injectable } from '@angular/core';
import { Menu, Order, OrderDto, OrderItem, OrderType, Product, ProductItem } from '@menno/types';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class PosService extends OrderDto {
  constructor(private menuService: MenuService) {
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
}

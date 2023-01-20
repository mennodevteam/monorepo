import { Injectable } from '@angular/core';
import { Order, OrderItem, Product } from '@menno/types';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class BasketService {
  items: OrderItem[] = [];
  note?: string;

  constructor(private menuService: MenuService) {}

  plus(product: Product) {
    const item = this.items?.find((x) => x.product?.id === product.id);
    if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
    else {
      const item = new OrderItem();
      product._orderItem = item;
      item.quantity = 1;
      item.title = product.title;
      item.price = Product.totalPrice(product);
      item.product = product;
      this.items.push(item);
    }
  }

  minus(product: Product) {
    const item = this.items?.find((x) => x.product?.id === product.id);
    if (item) {
      if (item.quantity > 1) item.quantity--;
      else {
        product._orderItem = undefined;
        this.items.splice(this.items.indexOf(item), 1);
      }
    }
  }

  getItem(productId: string) {
    return this.items?.find((x) => x.product?.id === productId);
  }

  clear() {
    this.items = [];
    this.note = undefined;
  }

  get abstractItems() {
    if (this.menuService.menu) {
      return Order.abstractItems(this.menuService.menu, this.items);
    }
    return [];
  }

  get sum() {
    return Order.sum(this.items);
  }

  get total() {
    if (this.menuService.menu) {
      return Order.total(this.menuService.menu, this.items);
    }
    return 0;
  }
}

import { Injectable } from '@angular/core';
import { OrderItem, Product } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class BasketService {
  items: OrderItem[] = [];

  constructor() {}

  plus(product: Product) {
    const item = this.items?.find((x) => x.product?.id === product.id);
    if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
    else {
      const item = new OrderItem();
      item.quantity = 1;
      item.title = product.title;
      item.product = product;
      this.items.push(item);
    }
  }

  minus(product: Product) {
    const item = this.items?.find((x) => x.product?.id === product.id);
    if (item) {
      if (item.quantity > 1) item.quantity--;
      else {
        this.items.splice(this.items.indexOf(item), 1);
      }
    }
  }

  getItem(productId: string) {
    return this.items?.find((x) => x.product?.id === productId);
  }

  clear() {
    this.items = [];
  }
}

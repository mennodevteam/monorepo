import { Injectable } from '@angular/core';
import { OrderItem, Product } from '@menno/types';
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
    const costs = this.menuService.menu?.costs?.filter((x) => !x.showOnItem) || [];
    const items: OrderItem[] = [];
    const sum = this.sum;
    for (const c of costs) {
      let price = 0;
      if (c.fixedCost) price += c.fixedCost;
      if (c.percentageCost) {
        const dis = (sum * c.percentageCost) / 100;
        price += Math.floor(dis / 500) * 500;
      }
      items.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price,
        title: c.title,
      });
    }
    return items;
  }

  get sum() {
    let sum = 0;
    for (const i of this.items) {
      sum += i.quantity * i.price;
    }
    return sum;
  }

  get total() {
    let total = this.sum;
    for (const i of this.abstractItems) {
      total += i.price;
    }
    return total;
  }
}

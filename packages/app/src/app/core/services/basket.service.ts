import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order, OrderDto, OrderItem, OrderType, Product } from '@menno/types';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class BasketService {
  items: OrderItem[] = [];
  note?: string;

  constructor(
    private menuService: MenuService,
    private shopService: ShopService,
    private ordersService: OrdersService,
    private http: HttpClient
  ) {}

  plus(product: Product) {
    const item = this.items?.find((x) => x.product?.id === product.id);
    if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
    else {
      const item = new OrderItem(product);
      this.items.push(item);
      product._orderItem = item;
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

  get type() {
    return this.menuService.type;
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

  complete() {
    if (this.type != undefined && this.shopService.shop) {
      const dto: OrderDto = {
        productItems: this.items
          .filter((x) => x.product)
          .map((x) => ({ productId: x.product!.id, quantity: x.quantity })),
        type: this.type,
        note: this.note,
        shopId: this.shopService.shop.id,
      };
      if (this.isPaymentRequired) {
        this.ordersService.payAndAddOrder(dto);
      } else {
        return this.ordersService.save(dto);
      }
    }
    return null;
  }

  private get isPaymentAvailable() {
    return this.shopService.shop?.paymentGateway && !this.shopService.shop.appConfig?.disablePayment;
  }

  private get isPaymentRequired() {
    return this.isPaymentAvailable && this.shopService.shop?.appConfig?.requiredPayment?.includes(this.type!);
  }
}

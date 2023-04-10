import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MANUAL_COST_TITLE,
  MANUAL_DISCOUNT_TITLE,
  Menu,
  Order,
  OrderDto,
  OrderItem,
  OrderType,
  Product,
  ProductItem,
} from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { PrinterService } from './printer.service';
import { TodayOrdersService } from './today-orders.service';

@Injectable({
  providedIn: 'root',
})
export class PosService extends OrderDto {
  saving = false;
  editOrder?: Order;
  menu: Menu;

  constructor(
    private menuService: MenuService,
    private orderService: OrdersService,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private printer: PrinterService,
    private todayOrders: TodayOrdersService
  ) {
    super();
    this.clear();
  }

  get categories() {
    return this.menu?.categories;
  }

  setType(val: OrderType) {
    this.menu = this.menuService.baseMenu;
    this.type = val;
    Menu.setRefsAndSort(this.menu, this.type, true);
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

  async init(orderId?: string) {
    this.clear();
    this.setType(this.type);
    if (orderId) {
      const order = this.todayOrders.getById(orderId) || (await this.orderService.getById(orderId));
      if (order) {
        this.editOrder = order;
        this.note = order.note;
        this.productItems = Order.productItems(order).map((x) => ({
          productId: x.product!.id,
          quantity: x.quantity,
        }));
        this.note = order.note;
        this.manualDiscount = Math.abs(
          Order.abstractItems(order).find((x) => x.title === MANUAL_DISCOUNT_TITLE)?.price || 0
        );
        this.manualCost = Order.abstractItems(order).find((x) => x.title === MANUAL_COST_TITLE)?.price;
        this.address = order.address;
        this.setType(order.type);
        this.discountCoupon = order.discountCoupon;
      }
    }
  }

  clear() {
    this.productItems = [];
    this.note = undefined;
    this.address = undefined;
    this.discountCoupon = undefined;
    this.type = OrderType.DineIn;
    this.editOrder = undefined;
  }

  get items(): OrderItem[] {
    if (this.menu) {
      return OrderDto.productItems(this, this.menu);
    }
    return [];
  }

  get abstractItems(): OrderItem[] {
    if (this.menu) {
      return OrderDto.abstractItems(this, this.menu);
    }
    return [];
  }

  get sum() {
    if (this.menu) {
      return OrderDto.sum(this, this.menu);
    }
    return 0;
  }

  get total() {
    if (this.menu) {
      return OrderDto.total(this, this.menu);
    }
    return 0;
  }

  async save(print = false) {
    const dto: OrderDto = {
      id: this.editOrder?.id,
      productItems: this.productItems,
      type: this.type,
      details: this.details,
      manualCost: this.manualCost,
      manualDiscount: this.manualDiscount,
    } as OrderDto;
    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 3000 });
    const savedOrder = await this.orderService.save(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });
    this.clear();
    this.saving = false;

    if (print && savedOrder) this.printer.printOrder(savedOrder?.id);
  }
}

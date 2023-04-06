import { Injectable } from '@angular/core';
import { DeliveryArea, OrderDto, OrderItem, Product, ProductItem } from '@menno/types';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { ShopService } from './shop.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BasketService extends OrderDto {
  constructor(
    private menuService: MenuService,
    private shopService: ShopService,
    private ordersService: OrdersService,
    private http: HttpClient
  ) {
    super();
    this.menuService.typeObservable.subscribe((type) => {
      if (type != undefined) {
        this.type = type;
      }
    });
  }

  plus(product: Product) {
    const item = this.productItems?.find((x) => x.productId === product.id);
    if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
    else {
      const item: ProductItem = {
        productId: product.id,
        quantity: 1,
      };
      if (!this.productItems) this.productItems = [];
      this.productItems.push(item);
      product._orderItem = item;
    }
  }

  minus(product: Product) {
    const item = this.productItems?.find((x) => x.productId === product.id);
    if (item) {
      if (item.quantity > 1) item.quantity--;
      else {
        product._orderItem = undefined;
        this.productItems.splice(this.productItems.indexOf(item), 1);
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
    if (this.menuService.type != undefined) this.type = this.menuService.type;
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

  async setAddressDeliveryArea() {
    if (this.address && this.address.latitude && this.address.longitude) {
      try {
        this.address.deliveryArea = undefined;
        const d = await this.http
          .get<DeliveryArea>(
            `deliveryAreas/${this.shopService.shop?.id}/${this.address.latitude}/${this.address.longitude}`
          )
          .toPromise();
        if (d) {
          this.address.deliveryArea = d;
        }
      } catch (error) {
        this.address.deliveryArea = null;
      }
    }
  }

  complete() {
    if (this.type != undefined && this.shopService.shop) {
      const dto: OrderDto = {
        productItems: this.productItems.filter((x) => x.quantity),
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
    return this.isPaymentAvailable && this.shopService.shop?.appConfig?.requiredPayment?.includes(this.type);
  }
}

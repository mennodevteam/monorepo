import { Injectable } from '@angular/core';
import {
  DeliveryArea,
  DiscountCoupon,
  OrderDto,
  OrderItem,
  OrderType,
  Product,
  ProductItem,
  ProductVariant,
  Shop,
  Status,
} from '@menno/types';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { ShopService } from './shop.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class BasketService extends OrderDto {
  constructor(
    private menuService: MenuService,
    private shopService: ShopService,
    private ordersService: OrdersService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private translate: TranslateService
  ) {
    super();
    this.menuService.typeObservable.subscribe((type) => {
      if (type != undefined) {
        if (this.type != type) this.clear();
        this.type = type;
      }
    });
  }

  plus(product: Product, variant?: ProductVariant) {
    const item = this.getItem(product.id, variant?.id);

    if (!OrderDto.isStockValidForAddOne(product, variant, item)) {
      this.snack.open(
        this.translate.instant('basket.stockLimit', { value: variant?.stock || product.stock }),
        '',
        { panelClass: 'warning' }
      );
      return;
    }

    if (item) {
      item.quantity ? item.quantity++ : (item.quantity = 1);
    } else {
      const item: ProductItem = {
        productId: product.id,
        productVariantId: variant?.id,
        quantity: 1,
      };
      if (!this.productItems) this.productItems = [];
      this.productItems.push(item);
    }
    this.updateProductOrderItem(product, variant);
  }

  private updateProductOrderItem(product: Product, variant?: ProductVariant) {
    const productItems = this.productItems?.filter((x) => x.productId === product.id);
    const sum = productItems.reduce((sum, item) => sum + item.quantity, 0);
    if (sum) {
      product._orderItem = {
        quantity: productItems.reduce((sum, item) => sum + item.quantity, 0),
      } as ProductItem;
    } else {
      product._orderItem = undefined;
    }

    if (variant) {
      const variantItem = productItems.find((x) => x.productVariantId === variant?.id);
      if (variantItem?.quantity)
        variant._orderItem = {
          quantity: variantItem.quantity,
        } as ProductItem;
      else variant._orderItem = undefined;
    }
  }

  minus(product: Product, variant?: ProductVariant) {
    const item = this.getItem(product.id, variant?.id);
    if (item) {
      if (item.quantity > 1) item.quantity--;
      else {
        this.productItems.splice(this.productItems.indexOf(item), 1);
      }
    }
    this.updateProductOrderItem(product, variant);
  }

  getItem(productId: string, variantId?: number) {
    return this.productItems?.find((x) => x.productId === productId && x.productVariantId == variantId);
  }

  clear(deep?: boolean) {
    this.productItems = [];
    this.note = undefined;
    this.address = undefined;
    if (this.menuService.type != undefined) this.type = this.menuService.type;
    if (deep) {
      this.menuService.load();
      this.discountCoupon = undefined;
    }
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

  async checkDiscountCouponCode(code: string) {
    const coupon = await this.http
      .get<DiscountCoupon | undefined>(`discountCoupons/check/${this.shopService.shop?.id}/${code}`)
      .toPromise();
    if (coupon) this.discountCoupon = coupon;
    else this.snack.open(this.translate.instant('basket.discountCouponNotFound'));
  }

  async complete() {
    if (this.type == undefined || !this.shopService.shop) return;
    if (
      this.type === OrderType.Delivery &&
      (!this.address ||
        this.address.deliveryArea == null ||
        this.address.deliveryArea.status != Status.Active)
    )
      return;
    if (
      this.type === OrderType.DineIn &&
      this.shopService.shop.details?.tables?.length &&
      !this.details?.table
    )
      return;

    if (this.discountCoupon) {
      if (this.discountCoupon.minPrice && this.sum < this.discountCoupon.minPrice) {
        this.snack.open(
          this.translate.instant('basket.discountCouponMinPriceWarning', {
            value: this.discountCoupon.minPrice,
          })
        );
        return;
      }

      if (
        this.discountCoupon.orderTypes?.length &&
        this.discountCoupon.orderTypes.indexOf(this.type) === -1
      ) {
        this.snack.open(this.translate.instant('basket.discountCouponOrderTypeWarning'));
        return;
      }
    }

    const dto: OrderDto = {
      productItems: this.productItems.filter((x) => x.quantity),
      type: this.type,
      note: this.note,
      shopId: this.shopService.shop.id,
      address: this.address,
      details: this.details,
      discountCoupon: this.discountCoupon ? ({ id: this.discountCoupon.id } as DiscountCoupon) : undefined,
    };
    if (this.isPaymentRequired) {
      await this.ordersService.payAndAddOrder(dto);
    } else {
      const order = await this.ordersService.save(dto);
      this.clear(true);
      return order;
    }
    return null;
  }

  private get isPaymentAvailable() {
    if (this.shopService.shop) return Shop.isPaymentAvailable(this.shopService.shop);
    return false;
  }

  private get isPaymentRequired() {
    return (
      this.isPaymentAvailable &&
      this.total > 0 &&
      this.shopService.shop?.appConfig?.requiredPayment?.includes(this.type)
    );
  }
}

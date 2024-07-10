import { Injectable, WritableSignal, computed, effect, signal, untracked } from '@angular/core';
import {
  Address,
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
import { ShopService } from './shop.service';
import { OrdersService } from './orders.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

type SignalProductItem = { productId: string; variantId?: number; quantity: WritableSignal<number> };

@Injectable({
  providedIn: 'root',
})
export class CartService {
  quantity = signal<SignalProductItem[]>([]);

  note = signal<string | undefined>(undefined);
  address = signal<Address | undefined>(undefined);
  coupon = signal<DiscountCoupon | undefined>(undefined);
  table = signal<string | undefined>(undefined);
  private dto = computed(() => {
    return {
      productItems: this.productItems(),
      shopId: this.shopService.shop.id,
      type: this.menuService.type(),
      isManual: false,
      address: this.address(),
      note: this.note(),
      discountCoupon: this.coupon() ? { id: this.coupon()?.id } : undefined,
      details: { table: this.table() },
    } as OrderDto;
  });

  private productItems = computed(() => {
    return this.quantity().map((item) => this.getItem(item));
  });

  orderItems = computed(() => {
    return OrderDto.productItems(this.dto(), this.menuService.menu());
  });

  abstractItems = computed(() => {
    return OrderDto.abstractItems(this.dto(), this.menuService.menu());
  });

  sum = computed(() => {
    return OrderDto.sum(this.dto(), this.menuService.menu());
  });

  total = computed(() => {
    return OrderDto.total(this.dto(), this.menuService.menu());
  });

  constructor(
    private menuService: MenuService,
    private shopService: ShopService,
    private ordersService: OrdersService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {
    effect(() => {
      const menu = this.menuService.menu();
      untracked(() => {
        const items = this.quantity();
        const copy = [...items];
        for (const item of items) {
          if (!this.menuService.getProductById(item.productId)) copy.splice(copy.indexOf(item), 1);
        }
        this.quantity.set(copy);
      });
    });
    // this.menuService.typeObservable.subscribe((type) => {
    //   if (type != undefined) {
    //     if (this.type != type) this.clear();
    //     this.type = type;
    //   }
    // });
  }

  plus(product: Product, variant?: ProductVariant) {
    const signalItem = this.getSignalItem(product.id, variant?.id);
    const item = signalItem ? this.getItem(signalItem) : undefined;

    if (!OrderDto.isStockValidForAddOne(product, variant, item)) {
      this.snack.open(
        this.translate.instant('basket.stockLimit', { value: variant?.stock || product.stock }),
        '',
        { panelClass: 'warning' },
      );
      return;
    }

    if (signalItem) {
      signalItem.quantity.update((v) => v + 1);
    } else {
      this.quantity.update((items) => [
        ...items,
        { productId: product.id, variantId: variant?.id, quantity: signal(1) },
      ]);
    }
  }

  minus(product: Product, variant?: ProductVariant) {
    const item = this.getSignalItem(product.id, variant?.id);

    if (item) {
      if (item.quantity() > 1) item.quantity.update((v) => v - 1);
      else {
        this.remove(product, variant);
      }
    }
  }

  remove(product: Product, variant?: ProductVariant) {
    const item = this.getSignalItem(product.id, variant?.id);

    if (item) {
      this.quantity.update((items) => {
        items.splice(items.indexOf(item), 1);
        return [...items];
      });
    }
  }

  getSignalItem(productId: string, variantId?: number) {
    return this.quantity().find((x) => x.productId === productId && x.variantId == variantId);
  }

  private getItem(item: SignalProductItem) {
    return {
      productId: item.productId,
      productVariantId: item.variantId,
      quantity: item.quantity(),
    } as ProductItem;
  }

  clear(deep?: boolean) {
    this.quantity.set([]);
    this.note.set(undefined);
    this.address.set(undefined);
    this.table.set(undefined);
    if (deep) {
      this.menuService.load();
      this.coupon.set(undefined);
    }
  }

  async setAddressDeliveryArea() {
    const address = this.address();
    if (address && address.latitude && address.longitude) {
      try {
        address.deliveryArea = undefined;
        const d = await this.http
          .get<DeliveryArea>(
            `deliveryAreas/${this.shopService.shop?.id}/${address.latitude}/${address.longitude}`,
          )
          .toPromise();
        if (d) {
          address.deliveryArea = d;
        }
      } catch (error) {
        address.deliveryArea = null;
      }
      this.address.set(address);
    }
  }

  async checkDiscountCouponCode(code: string) {
    const coupon = await this.http
      .get<DiscountCoupon | undefined>(`discountCoupons/check/${this.shopService.shop.id}/${code}`)
      .toPromise();
    if (coupon) this.coupon.set(coupon);
    else this.snack.open(this.translate.instant('basket.discountCouponNotFound'));
  }

  async complete() {
    if (this.menuService.type() == undefined || !this.shopService.shop) return;
    // await this.shopService.load(true);

    if (!this.shopService.isOpen) {
      this.snack.open(this.translate.instant('menu.shopIsClosed'), '', {
        panelClass: 'warning',
        duration: 4000,
      });
      return;
    } else if (this.shopService.shop?.appConfig?.disableOrdering) {
      this.snack.open(this.translate.instant('menu.disableOrderingTitle'), '', {
        panelClass: 'warning',
        duration: 4000,
      });
      return;
    }

    if (
      this.menuService.type() === OrderType.Delivery &&
      (!this.address ||
        this.address()?.deliveryArea == null ||
        this.address()?.deliveryArea?.status != Status.Active)
    )
      return;
    if (
      this.menuService.type() === OrderType.DineIn &&
      this.shopService.shop.details?.tables?.length &&
      !this.table()
    )
      return;

    const coupon = this.coupon();
    if (coupon) {
      if (coupon.minPrice && this.sum() < coupon.minPrice) {
        this.snack.open(
          this.translate.instant('basket.discountCouponMinPriceWarning', {
            value: coupon.minPrice,
          }),
        );
        return;
      }

      if (coupon.orderTypes?.length && coupon.orderTypes.indexOf(this.menuService.type()!) === -1) {
        this.snack.open(this.translate.instant('basket.discountCouponOrderTypeWarning'));
        return;
      }
    }

    if (this.isPaymentRequired) {
      await this.ordersService.payAndAddOrder(this.dto());
    } else {
      const order = await this.ordersService.save(this.dto());
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
      this.total() > 0 &&
      this.shopService.shop?.appConfig?.requiredPayment?.includes(this.menuService.type()!)
    );
  }
}

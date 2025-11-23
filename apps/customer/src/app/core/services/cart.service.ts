import { Injectable, WritableSignal, computed, effect, signal, untracked } from '@angular/core';
import {
  Address,
  DeliveryArea,
  DiscountCoupon,
  OrderDto,
  OrderPaymentType,
  OrderType,
  Product,
  ProductItem,
  ProductVariant,
  StatAction,
  Status,
} from '@menno/types';
import { MenuService } from './menu.service';
import { ShopService } from './shop.service';
import { OrdersService } from './orders.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddressesService } from './addresses.service';
import { ClubService } from './club.service';
import { PersianNumberService } from '@menno/utils';
import { CampaignService } from './campaign.service';
import { InitialParamsService } from './initial-params.service';
import { AnalyticsService } from './analytics.service';
import { MenuStatService } from './menu-stat.service';

const LOCAL_CART_QUANTITY_KEY = 'cartQuantity';

type SignalProductItem = { productId: string; variantId?: number; quantity: WritableSignal<number> };

@Injectable({
  providedIn: 'root',
})
export class CartService {
  paymentType = signal<OrderPaymentType | undefined>(undefined);
  useWallet = signal<boolean>(false);
  quantity = signal<SignalProductItem[]>([]);
  note = signal<string | undefined>(undefined);
  address = signal<Address | undefined>(undefined);
  coupon = signal<DiscountCoupon | undefined>(undefined);
  table = signal<string | undefined>(undefined);
  saving = signal<boolean>(false);

  private dto = computed(() => {
    return {
      productItems: this.productItems(),
      shopId: this.shopService.data()?.id,
      type: OrderType.Delivery,
      isManual: false,
      address: this.address(),
      note: this.note(),
      useWallet: this.useWallet(),
      discountCoupon: this.coupon(),
      details: { table: this.table() },
    } as OrderDto;
  });

  private productItems = computed(() => {
    return this.quantity().map((item) => this.getItem(item));
  });

  length = computed(() => {
    return this.quantity().length;
  });

  totalQuantity = computed(() => {
    return this.quantity().reduce((acc, item) => acc + item.quantity(), 0);
  });

  orderItems = computed(() => {
    return OrderDto.productItems(this.dto(), this.menuService.data()!);
  });

  abstractItems = computed(() => {
    return OrderDto.abstractItems(this.dto(), this.menuService.data()!);
  });

  sum = computed(() => {
    return OrderDto.sum(this.dto(), this.menuService.data()!);
  });

  realSum = computed(() => {
    return OrderDto.realSum(this.dto(), this.menuService.data()!);
  });

  sumDiscount = computed(() => {
    return this.realSum() - this.sum();
  });

  total = computed(() => {
    return OrderDto.total(this.dto(), this.menuService.data()!);
  });

  realTotal = computed(() => {
    return OrderDto.realTotal(this.dto(), this.menuService.data()!);
  });

  totalDiscount = computed(() => {
    return OrderDto.totalDiscount(this.dto(), this.menuService.data()!);
  });

  constructor(
    private menuService: MenuService,
    private shopService: ShopService,
    private ordersService: OrdersService,
    private campaign: CampaignService,
    private http: HttpClient,
    private snack: MatSnackBar,
    private addressesService: AddressesService,
    private club: ClubService,
    private initialParamsService: InitialParamsService,
    private analytics: AnalyticsService,
    private menuStat: MenuStatService,
  ) {
    const localQuantity = JSON.parse(localStorage.getItem(LOCAL_CART_QUANTITY_KEY) || 'null');
    if (localQuantity?.items?.length && localQuantity.date > Date.now() - 1000 * 60 * 60 * 24) {
      this.quantity.set(
        localQuantity.items.map((x: any) => ({
          productId: x.productId,
          variantId: x.variantId,
          quantity: signal(x.quantity),
        })),
      );
    }

    effect(() => {
      const items = this.quantity();
      if (items.length) {
        localStorage.setItem(
          LOCAL_CART_QUANTITY_KEY,
          JSON.stringify({ date: Date.now(), items: items.map((x) => ({ ...x, quantity: x.quantity() })) }),
        );
      } else {
        localStorage.removeItem(LOCAL_CART_QUANTITY_KEY);
      }
    });

    effect(() => {
      const menu = this.menuService.data()!;
      const items = untracked(() => this.quantity());
      if (items.length) {
        const copy = [...items];
        let hasChange = false;
        for (const item of items) {
          const product = this.menuService.getProductById(item.productId);
          const variant = product?.variants?.find((x) => x.id === item.variantId);
          if (!product || (item.variantId && !variant) || Product.isFinished(product, variant)) {
            copy.splice(copy.indexOf(item), 1);
            hasChange = true;
          }
        }
        if (hasChange) this.quantity.set(copy);
      }
    });

    effect(
      () => {
        if (!this.address() && this.addressesService.addresses()?.length) {
          this.address.set(this.addressesService.addresses()?.[0]);
        }
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      const coupons = this.club.coupons();
      untracked(() => {
        if (coupons[0] && !this.coupon()) this.coupon.set(coupons[0]);
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
      this.snack.open(`تعداد بیشتری در انبار موجود نیست`, '', {
        panelClass: 'warning',
        duration: 2000,
      });
      return;
    }

    // check max basket
    if (product.maxBasket) {
      const productItemsQuantity = this.getSignalItemsBasedOnProduct(product.id).map((item) =>
        item.quantity(),
      );
      const productSum = productItemsQuantity.reduce((partialSum, a) => partialSum + a, 0);
      if (productSum >= 1) {
        this.snack.open(`امکان انتخاب بیشتر از ${product.maxBasket} از این محصول وجود ندارد`, '', {
          panelClass: 'warning',
          duration: 2000,
        });
        return;
      }
    }

    if (signalItem) {
      signalItem.quantity.update((v) => v + 1);
    } else {
      this.quantity.update((items) => [
        ...items,
        { productId: product.id, variantId: variant?.id, quantity: signal(1) },
      ]);

      this.menuStat.send(StatAction.AddToCart, { productId: product.id });
    }

    this.analytics.trackEvent('add_to_cart', {
      productId: product.id,
      variantId: variant?.id,
      productName: product.title,
      quantity: 1,
    });
  }

  minus(product: Product, variant?: ProductVariant) {
    const item = this.getSignalItem(product.id, variant?.id);

    if (item) {
      if (item.quantity() > 1) item.quantity.update((v) => v - 1);
      else {
        this.remove(product, variant);
      }
    }

    this.analytics.trackEvent('remove_from_cart', { productId: product.id, variantId: variant?.id });
  }

  remove(product: Product, variant?: ProductVariant) {
    const item = this.getSignalItem(product.id, variant?.id);

    if (item) {
      this.quantity.update((items) => {
        items.splice(items.indexOf(item), 1);
        return [...items];
      });
    }

    this.analytics.trackEvent('remove_from_cart', { productId: product.id, variantId: variant?.id });
  }

  getSignalItem(productId: string, variantId?: number) {
    return this.quantity().find((x) => x.productId === productId && x.variantId == variantId);
  }

  getSignalItemsBasedOnProduct(productId: string) {
    return this.quantity().filter((x) => x.productId === productId);
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
    this.paymentType.set(undefined);
    this.useWallet.set(false);
    this.saving.set(false);
    if (deep) {
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
            `deliveryAreas/${this.shopService.data()?.id}/${address.latitude}/${address.longitude}`,
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

  async complete() {
    // if (this.shopService.isOrderingTemporaryDisabled) {
    //   this.snack.open(this.translate.instant('shop.disabledOrderingBanner.description'), '', {
    //     panelClass: 'warning',
    //     duration: 4000,
    //   });
    //   return;
    // } else if (this.shopService.isCloseTime) {
    //   this.snack.open(this.translate.instant('menu.closeTimeBanner.description'), '', {
    //     panelClass: 'warning',
    //     duration: 4000,
    //   });
    //   return;
    // } else if (this.shopService.isOrderingDisabledOnType(this.menuService.type())) {
    //   this.snack.open(this.translate.instant('menu.disabledOrderingGlobalBanner.description'), '', {
    //     panelClass: 'warning',
    //     duration: 4000,
    //   });
    //   return;
    // }

    const address = this.address();
    if (!address) {
      this.snack.open('لطفا آدرس خود را انتخاب کنید', '', { duration: 2000 });
      return;
    } else if (address.deliveryArea == null || address.deliveryArea.status != Status.Active) {
      this.snack.open('آدرس انخاب شده خارج از محدوده است', '', { duration: 2000 });
      return;
    } else if (address?.deliveryArea.minOrderPrice && address.deliveryArea.minOrderPrice > this.total()) {
      this.snack.open(`مبلغ سفارش حداقل ${address.deliveryArea.minOrderPrice} باشد`, '', {
        duration: 4000,
      });
      return;
    }

    const coupon = this.coupon();
    if (coupon) {
      if (coupon.minPrice && this.sum() < coupon.minPrice) {
        this.snack.open(`مبلغ سفارش حداقل ${coupon.minPrice} باشد`, '', { duration: 4000 });
        return;
      }

      if (coupon.orderTypes?.length && coupon.orderTypes.indexOf(OrderType.Delivery!) === -1) {
        this.snack.open(`امکان استفاده از این کد تخفیف در سفارشات ارسالی وجود ندارد`, '', {
          duration: 4000,
        });
        return;
      }
    }

    this.saving.set(true);
    try {
      if (this.shopService.isPaymentAvailable()) {
        const order = await this.ordersService.payAndAddOrder(this.dto(), this.total());
        if (order) {
          this.menuStat.send(StatAction.AddOrder, { value: this.total() });
          this.clear(true);
          return order;
        }
      } else {
        const order = await this.ordersService.save(this.dto());
        this.menuStat.send(StatAction.AddOrder, { value: this.total() });
        this.clear(true);
        return order;
      }
    } finally {
      this.saving.set(false);
    }
    return null;
  }
}

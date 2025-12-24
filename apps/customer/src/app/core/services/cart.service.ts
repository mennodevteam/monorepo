import { Injectable, WritableSignal, computed, effect, signal, untracked, inject } from '@angular/core';
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
import { AuthService } from './auth.service';
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
  private menuService = inject(MenuService);
  private shopService = inject(ShopService);
  private ordersService = inject(OrdersService);
  private campaign = inject(CampaignService);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  private addressesService = inject(AddressesService);
  private club = inject(ClubService);
  private auth = inject(AuthService);
  private initialParamsService = inject(InitialParamsService);
  private analytics = inject(AnalyticsService);
  private menuStat = inject(MenuStatService);

  paymentType = signal<OrderPaymentType | undefined>(undefined);
  useWallet = signal<boolean>(false);
  quantity = signal<SignalProductItem[]>([]);
  note = signal<string | undefined>(undefined);
  address = signal<Address | undefined>(undefined);
  coupon = signal<DiscountCoupon | undefined>(undefined);
  table = signal<string | undefined>(undefined);
  saving = signal<boolean>(false);
  orderType = signal<OrderType>(OrderType.Delivery);

  private dto = computed(() => {
    return {
      productItems: this.productItems(),
      shopId: this.shopService.data()?.id,
      type: this.orderType(),
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
    const menu = this.menuService.data();
    return menu ? OrderDto.productItems(this.dto(), menu) : [];
  });

  abstractItems = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.abstractItems(this.dto(), menu) : [];
  });

  deliveryCost = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.deliveryCost(this.dto(), menu) : 0;
  });

  sum = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.sum(this.dto(), menu) : 0;
  });

  realSum = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.realSum(this.dto(), menu) : 0;
  });

  sumDiscount = computed(() => {
    return this.realSum() - this.sum();
  });

  total = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.total(this.dto(), menu) : 0;
  });

  realTotal = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.realTotal(this.dto(), menu) : 0;
  });

  totalDiscount = computed(() => {
    const menu = this.menuService.data();
    return menu ? OrderDto.totalDiscount(this.dto(), menu) : 0;
  });

  constructor() {
    const localQuantity = JSON.parse(localStorage.getItem(LOCAL_CART_QUANTITY_KEY) || 'null');
    if (localQuantity?.items?.length && localQuantity.date > Date.now() - 1000 * 60 * 60 * 24) {
      this.quantity.set(
        localQuantity.items.map((x: { productId: string; variantId?: number; quantity: number }) => ({
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
          JSON.stringify({
            date: Date.now(),
            items: items.map((x: SignalProductItem) => ({ ...x, quantity: x.quantity() })),
          }),
        );
      } else {
        localStorage.removeItem(LOCAL_CART_QUANTITY_KEY);
      }
    });

    effect(() => {
      const menu = this.menuService.data();
      if (!menu) return;
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
  }

  plus(product: Product, variant?: ProductVariant) {
    if (this.shopService.isOrderingTemporaryDisabled) {
      this.snack.open('در حال حاضر امکان ثبت سفارش وجود ندارد. به زودی برمی‌گردیم.', '', {
        panelClass: 'warning',
        duration: 4000,
      });
      return;
    }

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
    if (this.shopService.isOrderingTemporaryDisabled) {
      this.snack.open('در حال حاضر امکان ثبت سفارش وجود ندارد. به زودی برمی‌گردیم.', '', {
        panelClass: 'warning',
        duration: 4000,
      });
      return;
    }

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

      if (coupon.orderTypes?.length && coupon.orderTypes.indexOf(OrderType.Delivery) === -1) {
        this.snack.open(`امکان استفاده از این کد تخفیف در سفارشات ارسالی وجود ندارد`, '', {
          duration: 4000,
        });
        return;
      }
    }

    this.saving.set(true);
    try {
      if (
        this.shopService.isPaymentRequired() ||
        (this.shopService.isPaymentAvailable() && this.paymentType() === OrderPaymentType.Online)
      ) {
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

  get isPaymentRequired() {
    return this.shopService.isPaymentRequired();
  }

  get isLoginRequired() {
    return (
      this.isPaymentRequired ||
      this.paymentType() === OrderPaymentType.Online ||
      this.orderType() === OrderType.Delivery
    );
  }
}

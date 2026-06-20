import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  Address,
  DiscountCoupon,
  MANUAL_COST_TITLE,
  MANUAL_DISCOUNT_TITLE,
  Order,
  OrderDetails,
  OrderDto,
  OrderState,
  OrderType,
  Product,
  ProductItem,
  ProductVariant,
  User,
} from '@menno/types';
import { MenuService } from '../../menu/menu.service';
import { ShopService } from '../../shop/shop.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../order.service';

@Injectable()
export class NewOrdersService {
  private readonly shop = inject(ShopService);
  private readonly menu = inject(MenuService);
  private readonly ordersService = inject(OrdersService);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private items = signal<ProductItem[]>([]);
  dirty = signal(false);
  customer = signal<User | undefined>(undefined);
  order = signal<Order | undefined>(undefined);
  address = signal<Address | undefined>(undefined);
  manualDiscount = signal(0);
  manualCost = signal(0);
  discountCoupon = signal<DiscountCoupon | undefined>(undefined);
  type = signal<OrderType | undefined>(this.shop.data()?.appConfig?.orderingTypes[0]);

  // Order configuration
  orderDateTime = signal<Date>(new Date());
  useCurrentDateTime = signal<boolean>(true);
  excludeFromReport = signal<boolean>(false);
  extraCost = signal<number>(0);
  orderReferrer = signal<string>('');
  orderCampaign = signal<string>('');

  constructor() {
    effect(() => {
      const order = this.order();
      if (order) {
        this.type.set(order.type);
        if (order.customer) this.customer.set(order.customer);
        if (order.address) this.address.set(order.address);
        const productItems = order.items
          .filter((x) => !x.isAbstract && x.product)
          .map((x, i) => ({
            productId: x.product!.id,
            productVariantId: x.productVariant?.id,
            quantity: x.quantity,
            addIndex: x.details?.addIndex ?? i + 1,
          }))
          .sort((a, b) => a.addIndex! - b.addIndex!);
        this.items.set(productItems);
        const manualCost = order.items.find((x) => x.title === MANUAL_COST_TITLE && x.isAbstract);
        if (manualCost) this.manualCost.set(manualCost.price);
        const manualDiscount = order.items.find((x) => x.title === MANUAL_DISCOUNT_TITLE && x.isAbstract);
        if (manualDiscount) this.manualDiscount.set(-manualDiscount.price);
        if (order.extraCosts) this.extraCost.set(order.extraCosts);
        if (order.excludeFromReports) this.excludeFromReport.set(order.excludeFromReports);
        if (order.createdAt) {
          this.orderDateTime.set(order.createdAt);
          this.useCurrentDateTime.set(true);
        }
        this.orderReferrer.set(order.details?.referrer ?? '');
        this.orderCampaign.set(order.details?.campaign ?? '');
      }
    });

    effect(() => {
      const shop = this.shop.data();
      if (shop?.appConfig?.orderingTypes?.length && !this.order() && this.type() === undefined) {
        this.type.set(shop.appConfig.orderingTypes[0]);
      }
    });
  }

  dto = computed(() => {
    const details: OrderDetails = { ...(this.order()?.details || {}) };
    const ref = this.orderReferrer().trim();
    const camp = this.orderCampaign().trim();
    if (ref) details.referrer = ref;
    else delete details.referrer;
    if (camp) details.campaign = camp;
    else delete details.campaign;

    return {
      id: this.order()?.id,
      productItems: this.items(),
      customerId: this.customer()?.id || null,
      address: this.customer() && this.type() === OrderType.Delivery ? this.address() : null,
      manualCost: this.manualCost(),
      manualDiscount: this.manualDiscount(),
      extraCosts: this.extraCost(),
      excludeFromReports: this.excludeFromReport(),
      isManual: this.order()?.isManual ?? true,
      type: this.type(),
      state: !this.order() ? OrderState.Pending : undefined,
      seenAt: !this.order() ? new Date() : undefined,
      date: this.useCurrentDateTime() ? undefined : this.orderDateTime(),
      details: Object.keys(details).length ? details : undefined,
    } as OrderDto;
  });

  productItems = computed(() => {
    const menu = this.menu.data();
    if (menu) {
      return OrderDto.productItems(this.dto(), menu);
    }
    return [];
  });

  abstractItems = computed(() => {
    const menu = this.menu.data();
    if (menu) {
      return OrderDto.abstractItems(this.dto(), menu);
    }
    return [];
  });

  totalPrice = computed(() => {
    const menu = this.menu.data();
    if (menu) {
      return OrderDto.total(this.dto(), menu);
    }
    return 0;
  });

  sum = computed(() => {
    const menu = this.menu.data();
    if (menu) {
      return OrderDto.sum(this.dto(), menu);
    }
    return 0;
  });

  add(product: Product, variant?: ProductVariant) {
    this.dirty.set(true);
    this.items.update((items) => {
      const exist = items.find((x) => x.productId === product.id && x.productVariantId === variant?.id);
      if (exist) exist.quantity++;
      else
        items.push({
          productId: product.id,
          productVariantId: variant?.id,
          quantity: 1,
          addIndex: this.nextAddIndex(items),
        });
      return [...items];
    });
  }

  minus(product: Product, variant?: ProductVariant) {
    this.dirty.set(true);
    this.items.update((items) => {
      const exist = items.find((x) => x.productId === product.id && x.productVariantId === variant?.id);
      if (exist) {
        exist.quantity--;
        if (exist.quantity <= 0) items.splice(items.indexOf(exist), 1);
        return [...items];
      }
      return items;
    });
  }

  remove(product: Product, variant?: ProductVariant) {
    this.dirty.set(true);
    this.items.update((items) => {
      const exist = items.find((x) => x.productId === product.id && x.productVariantId === variant?.id);
      if (exist) {
        items.splice(items.indexOf(exist), 1);
        return [...items];
      }
      return items;
    });
  }

  private nextAddIndex(items: ProductItem[]) {
    if (!items.length) return 1;
    return Math.max(...items.map((x) => x.addIndex ?? 0)) + 1;
  }

  clear() {
    this.dirty.set(false);
    this.type.set(this.shop.data()?.appConfig?.orderingTypes[0]);
    this.items.set([]);
    this.address.set(undefined);
    this.manualCost.set(0);
    this.manualDiscount.set(0);
    this.discountCoupon.set(undefined);
    this.order.set(undefined);

    // Reset configuration
    this.orderDateTime.set(new Date());
    this.useCurrentDateTime.set(true);
    this.excludeFromReport.set(false);
    this.extraCost.set(0);
    this.orderReferrer.set('');
    this.orderCampaign.set('');
  }

  updateConfig(config: {
    orderDateTime: Date;
    useCurrentDateTime: boolean;
    excludeFromReport: boolean;
    extraCost: number;
    referrer?: string;
    campaign?: string;
  }) {
    this.orderDateTime.set(config.orderDateTime);
    this.useCurrentDateTime.set(config.useCurrentDateTime);
    this.excludeFromReport.set(config.excludeFromReport);
    this.extraCost.set(config.extraCost);
    this.orderReferrer.set(config.referrer ?? '');
    this.orderCampaign.set(config.campaign ?? '');
    this.dirty.set(true);
  }

  async save(print = false) {
    if (this.productItems().length < 1) return;
    if (this.discountCoupon()?.minPrice && this.sum() < (this.discountCoupon()?.minPrice || 0)) {
      this.snack.open(
        this.translate.instant('pos.discountCouponMinPrice', {
          value: this.discountCoupon()?.minPrice,
        }),
        '',
        { panelClass: 'warning' },
      );
      return;
    }

    const dto = this.dto();

    this.snack.open(this.translate.instant('app.saving'), '', { duration: 3000 });
    const savedOrder = await this.ordersService.saveMutation.mutateAsync(dto);
    this.clear();
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });

    // this.analytics.event(this.editOrder ? 'edit order' : 'add order');

    // this.menuService.loadMenu();
    // if (print && savedOrder) this.printer.printOrder(savedOrder?.id);
  }
}

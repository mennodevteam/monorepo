import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  isEditMode = !!this.route.snapshot.params['id'];
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

  // Slot management
  activeSlot = signal<number>(1);
  slotsUpdated = signal<number>(0);
  private isLoadingSlot = false;

  slotsMetadata = computed(() => {
    this.slotsUpdated(); // Dependency to trigger re-evaluation
    const metadata = [];
    for (let i = 1; i <= 4; i++) {
      const dataStr = localStorage.getItem(`new-order-slot-${i}`);
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          const itemCount = data.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
          const customerName = data.customer?.firstName 
            ? `${data.customer.firstName} ${data.customer.lastName || ''}`.trim() 
            : (data.customer?.phone || '');
          metadata.push({
            id: i,
            isEmpty: itemCount === 0 && !customerName,
            itemCount,
            customerName,
          });
        } catch (e) {
          metadata.push({ id: i, isEmpty: true, itemCount: 0, customerName: '' });
        }
      } else {
        metadata.push({ id: i, isEmpty: true, itemCount: 0, customerName: '' });
      }
    }
    return metadata;
  });

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

    effect(() => {
      const slot = this.activeSlot();
      const items = this.items();
      const customer = this.customer();
      const address = this.address();
      const manualDiscount = this.manualDiscount();
      const manualCost = this.manualCost();
      const discountCoupon = this.discountCoupon();
      const type = this.type();
      const orderDateTime = this.orderDateTime();
      const useCurrentDateTime = this.useCurrentDateTime();
      const excludeFromReport = this.excludeFromReport();
      const extraCost = this.extraCost();
      const orderReferrer = this.orderReferrer();
      const orderCampaign = this.orderCampaign();
      
      if (this.isEditMode) return;
      if (this.isLoadingSlot) return;
      
      const isEmpty = items.length === 0 &&
                      !customer &&
                      manualDiscount === 0 &&
                      manualCost === 0 &&
                      !discountCoupon &&
                      extraCost === 0 &&
                      !orderReferrer &&
                      !orderCampaign;
                      
      if (isEmpty) {
        localStorage.removeItem(`new-order-slot-${slot}`);
      } else {
        const slotData = {
          items,
          customer,
          address,
          manualDiscount,
          manualCost,
          discountCoupon,
          type,
          orderDateTime,
          useCurrentDateTime,
          excludeFromReport,
          extraCost,
          orderReferrer,
          orderCampaign,
        };
        localStorage.setItem(`new-order-slot-${slot}`, JSON.stringify(slotData));
      }
      this.slotsUpdated.update((n) => n + 1);
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
      campaign: this.menu.activeCampaign(),
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
    this.clearFormOnly();
    if (!this.isEditMode) {
      const currentSlot = this.activeSlot();
      localStorage.removeItem(`new-order-slot-${currentSlot}`);
      this.slotsUpdated.update((n) => n + 1);
    }
  }

  clearFormOnly() {
    this.dirty.set(false);
    this.items.set([]);
    this.address.set(undefined);
    this.manualCost.set(0);
    this.manualDiscount.set(0);
    this.discountCoupon.set(undefined);
    this.order.set(undefined);
    this.customer.set(undefined);
    this.type.set(this.shop.data()?.appConfig?.orderingTypes[0]);

    // Reset configuration
    this.orderDateTime.set(new Date());
    this.useCurrentDateTime.set(true);
    this.excludeFromReport.set(false);
    this.extraCost.set(0);
    this.orderReferrer.set('');
    this.orderCampaign.set('');
  }

  loadLastActiveSlot() {
    const savedActive = localStorage.getItem('new-order-active-slot');
    const slotId = savedActive ? parseInt(savedActive, 10) : 1;
    this.selectSlot(slotId);
  }

  selectSlot(slotId: number) {
    if (this.isEditMode) return; // Do not allow slot switching in edit mode
    
    this.isLoadingSlot = true;
    this.activeSlot.set(slotId);
    localStorage.setItem('new-order-active-slot', String(slotId));
    
    const dataStr = localStorage.getItem(`new-order-slot-${slotId}`);
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        this.items.set(data.items || []);
        this.customer.set(data.customer || undefined);
        this.address.set(data.address || undefined);
        this.manualDiscount.set(data.manualDiscount || 0);
        this.manualCost.set(data.manualCost || 0);
        this.discountCoupon.set(data.discountCoupon || undefined);
        this.type.set(data.type || this.shop.data()?.appConfig?.orderingTypes[0]);
        
        this.orderDateTime.set(data.orderDateTime ? new Date(data.orderDateTime) : new Date());
        this.useCurrentDateTime.set(data.useCurrentDateTime !== false);
        this.excludeFromReport.set(!!data.excludeFromReport);
        this.extraCost.set(data.extraCost || 0);
        this.orderReferrer.set(data.orderReferrer || '');
        this.orderCampaign.set(data.orderCampaign || '');
        
        this.dirty.set(
          (data.items && data.items.length > 0) ||
          data.customer !== undefined ||
          (data.manualDiscount && data.manualDiscount > 0) ||
          (data.manualCost && data.manualCost > 0)
        );
      } catch (e) {
        this.clearFormOnly();
      }
    } else {
      this.clearFormOnly();
    }
    
    this.isLoadingSlot = false;
    this.slotsUpdated.update((n) => n + 1);
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

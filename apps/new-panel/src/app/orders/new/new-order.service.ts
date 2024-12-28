import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  Address,
  DiscountCoupon,
  Order,
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

  dto = computed(
    () =>
      ({
        productItems: this.items(),
        customerId: this.customer()?.id,
        address: this.customer() && this.type() === OrderType.Delivery ? this.address() : undefined,
        manualCost: this.manualCost(),
        manualDiscount: this.manualDiscount(),
        type: this.type(),
        state: OrderState.Pending,
      }) as OrderDto,
  );

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
      else items.push({ productId: product.id, productVariantId: variant?.id, quantity: 1 });
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

  clear() {
    this.dirty.set(false);
    this.type.set(this.shop.data()?.appConfig?.orderingTypes[0]);
    this.items.set([]);
    this.address.set(undefined);
    this.manualCost.set(0);
    this.manualDiscount.set(0);
    this.discountCoupon.set(undefined);
    this.order.set(undefined);
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

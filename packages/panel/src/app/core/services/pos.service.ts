import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DiscountCoupon,
  MANUAL_COST_TITLE,
  MANUAL_DISCOUNT_TITLE,
  Menu,
  Order,
  OrderDto,
  OrderItem,
  OrderPaymentType,
  OrderState,
  OrderType,
  Product,
  ProductItem,
  User,
} from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { PrinterService } from './printer.service';
import { TodayOrdersService } from './today-orders.service';
import { ShopService } from './shop.service';
import { ClubService } from './club.service';

declare let persianDate: any;

@Injectable({
  providedIn: 'root',
})
export class PosService extends OrderDto {
  saving = false;
  editOrder?: Order;
  menu: Menu;
  discountCoupons?: DiscountCoupon[];
  selectedDiscountCoupon?: DiscountCoupon;
  private _customer?: User;

  thisWeekPurchases = {
    total: 0,
    count: 0,
  };
  thisMonthPurchases = {
    total: 0,
    count: 0,
  };
  thisYearPurchases = {
    total: 0,
    count: 0,
  };

  constructor(
    private menuService: MenuService,
    private orderService: OrdersService,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private printer: PrinterService,
    private todayOrders: TodayOrdersService,
    private shopService: ShopService,
    private club: ClubService
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
    if (val === OrderType.DineIn && this.shopService.shop?.details?.tables?.length) {
      this.details = { ...this.details, table: this.shopService.shop.details.tables[0].code };
    }
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
        this.customer = order.customer;
        this.customerId = order.customer?.id;
      }
    }
  }

  clear() {
    this.productItems = [];
    this.note = undefined;
    this.address = undefined;
    this.discountCoupon = undefined;
    this.editOrder = undefined;
    this.customer = undefined;
    this.setType(OrderType.DineIn);
  }

  get customer() {
    return this._customer;
  }

  set customer(user) {
    this.thisWeekPurchases.count = 0;
    this.thisWeekPurchases.total = 0;
    this.thisMonthPurchases.count = 0;
    this.thisMonthPurchases.total = 0;
    this.thisYearPurchases.count = 0;
    this.thisYearPurchases.total = 0;
    this._customer = user;

    if (user) {
      this.orderService
        .report({
          fromDate: new persianDate().startOf('year').startOf('day').toDate(),
          payments: [OrderPaymentType.Cash, OrderPaymentType.ClubWallet, OrderPaymentType.Online],
          groupBy: 'date',
          toDate: new Date(),
          customerId: user.id,
        })
        .then((report) => {
          if (report) {
            const keys = Object.keys(report);
            const startOfWeek = new persianDate().startOf('week').startOf('day').toDate().valueOf();
            const startOfMonth = new persianDate().startOf('month').startOf('day').toDate().valueOf();
            for (const d of keys) {
              const date = new Date(d);
              const purchaseDate = new Date(date).valueOf();
              if (purchaseDate >= startOfWeek) {
                this.thisWeekPurchases.count += report[d].count;
                this.thisWeekPurchases.total += report[d].sum;
              }
              if (purchaseDate >= startOfMonth) {
                this.thisMonthPurchases.count += report[d].count;
                this.thisMonthPurchases.total += report[d].sum;
              }
              this.thisYearPurchases.count += report[d].count;
              this.thisYearPurchases.total += report[d].sum;
            }
          }
        });

      this.club.getDiscountCoupons(user.id).then((coupons) => {
        this.discountCoupons = coupons.filter(
          (x) =>
            new Date(x.startedAt).valueOf() <= Date.now() && new Date(x.expiredAt).valueOf() >= Date.now()
        );
        if (!this.editOrder) this.selectedDiscountCoupon = this.discountCoupons[0];
        else if (this.editOrder && this.editOrder.discountCoupon) {
          this.selectedDiscountCoupon = coupons.find((x) => x.id === this.editOrder!.discountCoupon!.id);
        }
      });

      // this.http.get<Address[]>(`addresses/${this._member.userId}`).subscribe((addresses) => {
      //   this.addresses = addresses.filter(
      //     (x) =>
      //       (x.latitude && x.longitude) ||
      //       (x.deliveryArea && this.deliveryAreas.find((y) => y.id === x.deliveryArea.id))
      //   );
      //   if (this.addresses.length === 1 && this.type === OrderType.Delivery) this.address = this.addresses[0];
      // });
    }
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
      state: OrderState.Processing,
      details: this.details,
      isManual: this.editOrder?.isManual || true,
      manualCost: this.manualCost,
      manualDiscount: this.manualDiscount,
      customerId: this.customer?.id || null,
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
    this.todayOrders.loadData();

    if (print && savedOrder) this.printer.printOrder(savedOrder?.id);
  }
}

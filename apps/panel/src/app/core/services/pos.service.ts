import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Address,
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
  ProductVariant,
  Status,
  User,
} from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from './menu.service';
import { OrdersService } from './orders.service';
import { PrinterService } from './printer.service';
import { TodayOrdersService } from './today-orders.service';
import { ShopService } from './shop.service';
import { ClubService } from './club.service';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import {
  SelectDialogComponent,
  SelectItem,
} from '../../shared/dialogs/select-dialog/select-dialog.component';
import { MenuCurrencyPipe } from '../../shared/pipes/menu-currency.pipe';
import { MatomoService } from './matomo.service';

declare let persianDate: any;

@Injectable({
  providedIn: 'root',
})
export class PosService extends OrderDto {
  saving = false;
  editOrder?: Order;
  menu: Menu;
  discountCoupons?: DiscountCoupon[];
  customerAddresses: Address[];
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
    private club: ClubService,
    private http: HttpClient,
    private dialog: MatDialog,
    private menuCurrency: MenuCurrencyPipe,
    private matomo: MatomoService
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
    Menu.setRefsAndSort(this.menu, this.type, true, undefined, undefined, true);
    if (val === OrderType.DineIn && this.shopService.shop?.details?.tables?.length) {
      this.details = { ...this.details, table: this.shopService.shop.details.tables[0].code };
    }
  }

  async plus(productId: string, productVariantId?: number) {
    const product = this.menuService.getProductById(productId);
    let productVariant: ProductVariant | undefined = undefined;
    if (product) {
      if (product.variants?.length) {
        if (product.variants.length === 1) productVariant = product.variants[0];
        else if (productVariantId)
          productVariant = Menu.getProductVariantById(this.menu, productVariantId) || undefined;
        else {
          const items: SelectItem[] = product.variants.map((v) => ({
            title: v.title,
            subtitle: this.menuCurrency.transform(v.price),
            value: v,
          }));
          const selectedVariant = await this.dialog
            .open(SelectDialogComponent, {
              data: { items },
            })
            .afterClosed()
            .toPromise();
          if (selectedVariant) productVariant = selectedVariant;
          else return;
        }
      }

      const item = this.productItems?.find(
        (x) => x.productId === productId && x.productVariantId == productVariant?.id
      );

      if (!OrderDto.isStockValidForAddOne(product, productVariant, item, this.editOrder)) {
        const ok = await this.dialog
          .open(AlertDialogComponent, {
            data: {
              title: this.translate.instant(`pos.addProductStockWarning.title`),
              description: this.translate.instant(`pos.addProductStockWarning.description`, {
                value: productVariant ? productVariant.stock : product.stock,
              }),
              status: 'warning',
            },
          })
          .afterClosed()
          .toPromise();
        if (!ok) return;
      }

      if (item) item.quantity ? item.quantity++ : (item.quantity = 1);
      else {
        if (
          product.status !== Status.Active ||
          (productVariant?.status != undefined && productVariant?.status !== Status.Active)
        ) {
          const ok = await this.dialog
            .open(AlertDialogComponent, {
              data: {
                title: this.translate.instant(`pos.addProductWarning.title`, {
                  value: this.translate.instant(
                    product.status === Status.Inactive ? 'app.inactive' : 'app.finished'
                  ),
                }),
                description: this.translate.instant(`pos.addProductWarning.description`, {
                  value: this.translate.instant(
                    product.status === Status.Inactive ? 'app.inactive' : 'app.finished'
                  ),
                }),
                status: 'warning',
              },
            })
            .afterClosed()
            .toPromise();
          if (!ok) return;
        }
        const item: ProductItem = {
          productId: productId,
          productVariantId: productVariant?.id,
          quantity: 1,
        };

        if (!this.productItems) this.productItems = [];
        this.productItems.push(item);
        product._orderItem = item;
      }
    }
  }

  minus(productId: string, productVariantId?: number) {
    const product = this.menuService.getProductById(productId);
    if (product) {
      const item = this.productItems?.find(
        (x) => x.productId === product.id && x.productVariantId == productVariantId
      );
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
      const order = await this.orderService.getById(orderId, true);
      if (order) {
        this.editOrder = order;
        this.note = order.note;
        this.productItems = Order.productItems(order).map((x) => ({
          productId: x.product!.id,
          productVariantId: x.productVariant?.id,
          quantity: x.quantity,
        }));
        this.note = order.note;
        this.manualDiscount = Math.abs(
          Order.abstractItems(order).find((x) => x.title === MANUAL_DISCOUNT_TITLE)?.price || 0
        );
        this.customer = order.customer;
        this.manualCost = Order.abstractItems(order).find((x) => x.title === MANUAL_COST_TITLE)?.price;
        this.setType(order.type);
        this.address = order.address;
        this.details = order.details;
        this.isManual = order.isManual;
        this.discountCoupon = order.discountCoupon;
        this.customerId = order.customer?.id;
      }
    }
  }

  clear() {
    this.id = undefined;
    this.productItems = [];
    this.note = undefined;
    this.address = undefined;
    this.discountCoupon = undefined;
    this.editOrder = undefined;
    this.customer = undefined;
    this.manualCost = undefined;
    this.manualDiscount = undefined;
    this.details = {};
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
    this.discountCoupon = undefined;
    this.address = undefined;
    this.customerAddresses = [];

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
        if (!this.editOrder) this.discountCoupon = this.discountCoupons[0];
        else if (this.editOrder && this.editOrder.discountCoupon) {
          const selected = coupons.find((x) => x.id === this.editOrder!.discountCoupon!.id);
          if (!selected) this.discountCoupons.push(this.editOrder.discountCoupon);
        }
      });

      this.http.get<Address[]>(`addresses/${user.id}`).subscribe((addresses) => {
        this.customerAddresses = addresses.filter((x) => x.deliveryArea);
        if (this.customerAddresses.length === 1 && this.type === OrderType.Delivery)
          this.address = this.customerAddresses[0];
      });
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
    if (this.discountCoupon?.minPrice && this.sum < this.discountCoupon.minPrice) {
      this.snack.open(
        this.translate.instant('pos.discountCouponMinPrice', {
          value: this.menuCurrency.transform(this.discountCoupon.minPrice),
        }),
        '',
        { panelClass: 'warning' }
      );
      return;
    }

    if (this.type !== OrderType.DineIn && this.details?.table) delete this.details.table;
    const dto: OrderDto = {
      id: this.editOrder?.id,
      productItems: this.productItems,
      type: this.type,
      state: OrderState.Processing,
      details: this.details,
      isManual: this.editOrder?.isManual || true,
      manualCost: this.manualCost,
      manualDiscount: this.manualDiscount,
      discountCoupon: this.discountCoupon && { id: this.discountCoupon.id },
      customerId: this.customer?.id || null,
      address: this.type === OrderType.Delivery ? this.address : null,
      note: this.note,
    } as OrderDto;

    this.saving = true;
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 3000 });
    const savedOrder = await this.orderService.save(dto);
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', {
      duration: 5000,
      panelClass: 'success',
    });

    this.matomo.trackEvent('order', 'pos', this.editOrder ? 'edit order' : 'add order');

    this.clear();
    this.saving = false;
    this.menuService.loadMenu();
    this.todayOrders.loadData();

    if (print && savedOrder) this.printer.printOrder(savedOrder?.id);
  }
}

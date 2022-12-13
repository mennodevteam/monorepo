import { PlatformLocation } from '@angular/common';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SettlementDialogComponent } from '../../pages/orders/settlement-dialog/settlement-dialog.component';
import { ProgressDialogComponent } from '../../shared/dialogs/progress-dialog/progress-dialog.component';
import { PromptDialogComponent } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { MenuCurrencyPipe } from '../../shared/pipes/menu-currency.pipe';
import { DiscountCoupon } from '@menno/types';
import { Member } from '@menno/types';
import { Order } from '@menno/types';
import { OrderItem } from '@menno/types';
import { OrderState } from '@menno/types';
import { OrderType } from '@menno/types';
import { OrderDto } from '@menno/types';
import { Product } from '@menno/types';
import { ProductCategory } from '@menno/types';
import { ShopTable } from '@menno/types';
import { AuthService } from './auth.service';
import { ShopService } from './shop.service';
import { ClubService } from './club.service';
import { MenuService } from './menu.service';
import { OrderService } from './order.service';
import { PrinterService } from './printer.service';
import { MenuCost } from '@menno/types';
import { Address } from '@menno/types';
import { DeliveryArea } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { Status } from '@menno/types';
import { AlertDialogComponent } from '@shared/dialogs/alert-dialog/alert-dialog.component';

declare var persianDate: any;

@Injectable({
  providedIn: 'root'
})
export class PosService {
  selectedCategory: ProductCategory;
  order: Order;
  items: OrderItem[];
  discountCoupons: DiscountCoupon[];
  table: string;
  note: string;
  selectedDiscountCoupon: DiscountCoupon;
  manualDiscount: OrderItem;
  manualCost: OrderItem;
  addresses: Address[];
  deliveryAreas: DeliveryArea[] = [];
  showFactorDetails: boolean;
  onInit = new Subject<void>();

  private _type: OrderType;
  private _member: Member;
  private _address: Address;
  thisWeekPurchases: {
    total: number;
    count: number;
  }
  thisMonthPurchases: {
    total: number;
    count: number;
  }
  thisYearPurchases: {
    total: number;
    count: number;
  }

  constructor(
    private shopService: ShopService,
    private menu: MenuService,
    private auth: AuthService,
    private dialog: MatDialog,
    private club: ClubService,
    private ordersService: OrderService,
    private translate: TranslateService,
    private location: PlatformLocation,
    private snack: MatSnackBar,
    private menuCurrency: MenuCurrencyPipe,
    private printerService: PrinterService,
    private http: HttpClient,
  ) {
    this.init();
  }

  async init(orderId?: string) {
    try {
      this.menu.loadMenuCost();
    } catch (error) {}
    try {
      this.http.get<DeliveryArea[]>('deliveryAreas').subscribe((areas) => {
        this.deliveryAreas = areas;
      });
    } catch (error) { }
    const tables = this.shopService.instant.details.tables;
    tables.sort((a, b) => a.code < b.code ? -1 : 1);
    this.selectedCategory = this.menu.instant.categories[0];
    this.items = [];
    this.order = undefined;
    this.table = tables[0].code;
    this.type = OrderType.DineIn;
    this.note = undefined;
    this.addresses = undefined;
    this.address = undefined;
    this.member = undefined;
    this.showFactorDetails = false;
    this.manualDiscount = undefined;
    this.manualCost = undefined;
    if (orderId) {
      const progressRef = this.dialog.open(ProgressDialogComponent, {
        data: {
          description: this.translate.instant('pos.loadingOrder'),
        },
        disableClose: true,
      });
      const order = await this.ordersService.getById(orderId);
      this.order = order;
      this.items = this.order.items.filter(x => x.product);
      this.type = this.order.type;
      if (this.order.details.table) {
        try {
          const t = this.shopService.instant.details.tables.find(x => x.code === this.order.details.table);
          this.table = t.code;
        } catch (error) {
          this.table = this.order.details.table;
        }
      }
      if (order.customerId) {
        this.member = await this.club.getMemberByUserId(order.customerId);
      }

      const existManualDiscountItem = this.order.items.find(x => x.isAbstract && x.title === 'manualDiscount');
      if (existManualDiscountItem) {
        this.manualDiscount = existManualDiscountItem;
      }

      const existManualCostItem = this.order.items.find(x => x.isAbstract && x.title === 'manualCost');
      if (existManualCostItem) {
        this.manualCost = existManualCostItem;
      }

      progressRef.close();
    }

    if (!this.manualDiscount) {
      this.manualDiscount = new OrderItem();
      this.manualDiscount.price = 0;
      this.manualDiscount.quantity = 1;
      this.manualDiscount.title = 'manualDiscount';
      this.manualDiscount.isAbstract = true;
    }

    if (!this.manualCost) {
      this.manualCost = new OrderItem();
      this.manualCost.price = 0;
      this.manualCost.quantity = 1;
      this.manualCost.title = 'manualCost';
      this.manualCost.isAbstract = true;
    }

    this.onInit.next();
  }

  plusProduct(product: Product) {
    const item = this.items.find(x => x.product.id === product.id);
    if (item) {
      item.quantity++;
    } else {
      this.items.push(<OrderItem>{ product, quantity: 1, });
    }
  }

  minusProduct(product: Product) {
    const itemIndex = this.items.findIndex(x => x.product.id === product.id);
    if (itemIndex > -1) {
      this.items[itemIndex].quantity--;
      if (this.items[itemIndex].quantity <= 0) {
        this.items.splice(itemIndex, 1);
      }
    }
  }

  get type() {
    return this._type;
  }

  set type(t: OrderType) {
    this._type = t;
  }

  get address() {
    return this._address;
  }

  set address(a: Address) {
    if (a) {
      let area: DeliveryArea;
      if (a.latitude && a.longitude) {
        area = DeliveryArea.isInWitchArea(this.deliveryAreas, [a.latitude, a.longitude]);
      } else if (a.deliveryArea) {
        area = this.deliveryAreas.find(x => x.id === a.deliveryArea.id);
      }
      if (area) {
        if (area.status != Status.Active) {
          this.dialog.open(AlertDialogComponent, {
            data: {
              title: this.translate.instant('pos.disableAreaWarningDialogTitle'),
              description: this.translate.instant('pos.disableAreaWarningDialogDescription'),
            }
          }).afterClosed().subscribe((val) => {
            if (val) {
              this._address = a;
              a.deliveryArea = area;
            }
          })
        } else {
          this._address = a;
          a.deliveryArea = area;
        }
      } else {
        this.snack.open(this.translate.instant('pos.outsideAreaWarning'), '', { panelClass: 'warning' });
        this._address = undefined;
      }
    } else {
      this._address = undefined;
    }
  }

  get member() {
    return this._member;
  }

  set member(m: Member) {
    this.addresses = undefined;
    this._member = m;
    this.thisWeekPurchases = { total: 0, count: 0 };
    this.thisMonthPurchases = { total: 0, count: 0 };
    this.thisYearPurchases = { total: 0, count: 0 };
    this.discountCoupons = [];
    this.selectedDiscountCoupon = undefined;
    if (this._member) {
      this.club.filterPurchases({
        fromDate: new persianDate().startOf('year').startOf('day').toDate(),
        memberId: m.id,
      }).then((purchases) => {
        const startOfWeek = new persianDate().startOf('week').startOf('day').toDate().valueOf();
        const startOfMonth = new persianDate().startOf('month').startOf('day').toDate().valueOf();
        for (const p of purchases) {
          const purchaseDate = new Date(p.createdAt).valueOf();
          if (purchaseDate >= startOfWeek) {
            this.thisWeekPurchases.count++;
            this.thisWeekPurchases.total += p.price;
          }
          if (purchaseDate >= startOfMonth) {
            this.thisMonthPurchases.count++;
            this.thisMonthPurchases.total += p.price;
          }
          this.thisYearPurchases.count++;
          this.thisYearPurchases.total += p.price;
        }
      });

      this.club.getDiscountCoupons(this.member.id).then((coupons) => {
        this.discountCoupons = coupons.filter(x => new Date(x.startedAt).valueOf() <= Date.now() && new Date(x.expiredAt).valueOf() >= Date.now());
        if (!this.order) this.selectedDiscountCoupon = this.discountCoupons[0];
        else if (this.order.details && this.order.details.discountCouponId) {
          this.selectedDiscountCoupon = coupons.find(x => x.id === this.order.details.discountCouponId);
        }
      });

      this.http.get<Address[]>(`addresses/${this._member.userId}`).subscribe((addresses) => {
        this.addresses = addresses.filter((x) => (x.latitude && x.longitude) || (x.deliveryArea && this.deliveryAreas.find(y => y.id === x.deliveryArea.id)));
        if (this.addresses.length === 1 && this.type === OrderType.Delivery) this.address = this.addresses[0];
      })
    }
  }

  get sum() {
    let sum = 0;
    for (const item of this.items) {
      sum += this.getProductPrice(item.product) * item.quantity;
    }
    return sum;
  }

  get discountCouponValue(): number {
    if (this.selectedDiscountCoupon) {
      if (this.selectedDiscountCoupon.fixedDiscount) return this.selectedDiscountCoupon.fixedDiscount;
      if (this.selectedDiscountCoupon.percentageDiscount) {
        let val = this.sum * this.selectedDiscountCoupon.percentageDiscount / 100;
        if (this.selectedDiscountCoupon.maxDiscount) val = Math.min(val, this.selectedDiscountCoupon.maxDiscount);
        return val;
      }
    }
    return 0;
  }

  get totalPrice() {
    let sum = this.sum;
    let total = sum;
    const costs = this.menu.instant.costs.filter(x => !x.showOnItem && (!x.orderTypes || !x.orderTypes.length || x.orderTypes.indexOf(this.type) > -1));
    for (const cost of costs) {
      total += this.getCost(cost);
    }
    total += this.deliveryCost;
    if (this.manualCost) total += this.manualCost.price;
    if (this.manualDiscount) total += this.manualDiscount.price;
    total -= this.discountCouponValue;
    return total;
  }

  getCost(cost: MenuCost): number {
    if (cost.orderTypes && cost.orderTypes.indexOf(this.type) == -1) return 0;
    const menu = this.menu.instant;
    let price = 0;
    let includeProductIds = cost.includeProductIds || [];
    if (cost.includeProductCategoryIds) {
      for (const catId of cost.includeProductCategoryIds) {
        const category = menu.categories.find(x => x.id === catId);
        if (category && category.products) includeProductIds = [...includeProductIds, ...category.products.map(x => x.id)];
      }
    }
    if (includeProductIds.length) {
      const includedItems = this.items.filter(x => x.product && includeProductIds.indexOf(x.product.id) > -1);
      for (const item of includedItems) {
        if (cost.fixedCost) price += cost.fixedCost * item.quantity;
        else if (cost.percentageCost) price += (this.getProductPrice(item.product) * (cost.percentageCost / 100) * item.quantity);
      }
    } else {
      if (cost.fixedCost) price += cost.fixedCost;
      else if (cost.percentageCost) price += (this.sum * cost.percentageCost / 100);
    }

    return price;
  }

  get deliveryCost() {
    try {
      if (this.type === OrderType.Delivery) {
        const area = this.address.deliveryArea;
        if (area.minPriceForFree && this.sum >= area.minPriceForFree) return 0;
        else return area.price;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async save(printAfter?: boolean) {
    let orderId: string;
    if (this.selectedDiscountCoupon && this.selectedDiscountCoupon.minPrice && this.sum < this.selectedDiscountCoupon.minPrice) {
      this.snack.open(this.translate.instant('pos.discountCouponMinPriceError', {
        value: this.menuCurrency.transform(this.selectedDiscountCoupon.minPrice)
      }), '', { panelClass: 'warning' });
      return;
    }

    if (this.type == OrderType.Delivery) {
      if (!this.address || !this.address.deliveryArea) {
        this.snack.open(this.translate.instant('pos.addressRequiredWarning'), '', { panelClass: 'warning' });
        return;
      }
      if (this.address.deliveryArea.minOrderPrice > this.sum) {
        const val = await this.dialog.open(AlertDialogComponent, {
          data: {
            title: this.translate.instant('pos.minimumDeliveryPriceWarningDialogTitle'),
            description: this.translate.instant('pos.minimumDeliveryPriceWarningDialogDescription', {
              value: this.menuCurrency.transform(this.address.deliveryArea.minOrderPrice)
            }),
          }
        }).afterClosed().toPromise();
        if (!val) return;
      }
    } else {
      this._address = undefined;
    }

    const loadingDialog = this.dialog.open(ProgressDialogComponent, {
      data: {
        description: this.translate.instant('app.saving'),
      },
      disableClose: true,
    });

    if (!(await this.checkQuantityConfirmation())) {
      loadingDialog.close();
      return;
    }

    const dto: OrderDto = <OrderDto>{
      isManual: true,
      isPayed: false,
      productItems: this.items.map(x => ({
        productId: x.product.id,
        quantity: x.quantity,
      })),
      state: OrderState.Processing,
      customerId: this.member ? this.member.user.id : undefined,
      type: this.type,
      creatorId: this.auth.instantUser.id,
      details: {
        deliveryAreaId: this.address && (!this.address.latitude || !this.address.longitude) ? this.address.deliveryArea.id : undefined,
        latitude: this.address && this.address.latitude ? this.address.latitude : undefined,
        longitude: this.address && this.address.longitude ? this.address.longitude : undefined,
        address: this.address ? this.address.description : undefined,
        note: this.note,
        discountCouponId: this.selectedDiscountCoupon ? this.selectedDiscountCoupon.id : undefined,
        table: this.type === OrderType.DineIn ? this.table : undefined,
      }
    };
    

    dto.manualDiscount = this.manualDiscount.price;
    dto.manualCost = this.manualCost.price;

    if (this.order) {
      dto.id = this.order.id;
      await this.ordersService.editItems(dto);
      this.location.back();
      this.snack.open(this.translate.instant('pos.editedSuccessfully'), '', { panelClass: 'success' });
      orderId = this.order.id;
    } else {
      const order = await this.ordersService.insert(dto);
      this.snack.open(this.translate.instant('pos.addedSuccessfully'), this.translate.instant('pos.settlement'), { panelClass: 'success' }).onAction().subscribe(() => {
        this.dialog.open(SettlementDialogComponent, {
          data: { order }
        });
      });
      orderId = order.id;
    }
    this.init();
    loadingDialog.close();
    if (printAfter) {
      this.printerService.printOrder(orderId);
    }
  }

  getProductPrice(p: Product) {
    const costs = this.menu.instant.costs.filter(x => x.showOnItem && (!x.orderTypes || !x.orderTypes.length || x.orderTypes.indexOf(this.type) > -1));
    let price = p.price;
    for (const cost of costs) {
      let includeProductIds = cost.includeProductIds || [];
      if (cost.includeProductCategoryIds) {
        for (const catId of cost.includeProductCategoryIds) {
          const category = this.menu.instant.categories.find(x => x.id === catId);
          if (category && category.products) includeProductIds = [...includeProductIds, ...category.products.map(x => x.id)];
        }
      }

      if (!includeProductIds.length || includeProductIds.indexOf(p.id) > -1) {
        if (cost.fixedCost) price += cost.fixedCost;
        else if (cost.percentageCost) price += (p.price * (cost.percentageCost / 100));
      }
    }
    return price;
  }

  async checkQuantityConfirmation() {
    await this.menu.loadStockItems();
    for (const item of this.items) {
      if (item.product.limitQuantity && item.product.stockItem) {
        let prevCount = 0;
        if (this.order) {
          const prevItem = this.order.items.find(x => x.product && x.product.id === item.product.id);
          if (prevItem) prevCount = prevItem.quantity;
        }

        if (item.quantity > item.product.stockItem.quantity + prevCount) {
          const accept = await this.dialog.open(AlertDialogComponent, {
            data: {
              title: this.translate.instant('pos.stockItemAlertTitle'),
              description: this.translate.instant('pos.stockItemAlertDescription', { product: item.product.title, value: item.product.stockItem.quantity }),
              okText: this.translate.instant('pos.stockItemAlertOk'),
              cancelText: this.translate.instant('pos.stockItemAlertCancel'),
            },
            disableClose: true,
          }).afterClosed().toPromise();

          if (accept) return false;
        }
      }
    }
    return true;
  }
}

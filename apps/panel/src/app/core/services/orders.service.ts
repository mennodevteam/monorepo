import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDetails,
  OrderDto,
  OrderReportDto,
  OrderState,
} from '@menno/types';
import { AuthService } from './auth.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopService } from './shop.service';
import { InfiniteData, injectQueryClient } from '@tanstack/angular-query-experimental';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  queryClient = injectQueryClient();
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private translate: TranslateService,
    private snack: MatSnackBar,
    private shop: ShopService,
  ) {}

  async filter(dto: FilterOrderDto) {
    return this.http.post<Order[]>(`orders/filter`, dto).toPromise();
  }

  async save(dto: OrderDto) {
    const order = await this.http.post<Order>(`orders`, dto).toPromise();
    if (order) this.updateQuery(order, !dto.id);
    return order;
  }

  async getById(id: string, withProduct?: boolean) {
    let url = `orders/panel/${id}`;
    if (withProduct) url += `?withProduct=true`;
    return this.http.get<Order>(url).toPromise();
  }

  async report(dto: OrderReportDto) {
    return this.http
      .post<{ [key: string]: { count: number; sum: number } }>(`orders/report`, dto)
      .toPromise();
  }

  async changeState(order: Order, state: OrderState) {
    const prevState = order.state;
    try {
      order._changingState = true;
      order.state = state;
      this.updateQuery(order);
      const result = await this.http.get<Order>(`orders/changeState/${order.id}/${state}`).toPromise();
      if (result?.waiter) order.waiter = this.auth.instantUser!;
      this.updateQuery(order);
    } catch (error) {
      order.state = prevState;
      this.updateQuery(order);
    } finally {
      order._changingState = false;
      this.updateQuery(order);
    }
  }

  invalidateTodayQuery() {
    this.queryClient.invalidateQueries({ queryKey: ['orders/daily', 'today'] });
    this.queryClient.invalidateQueries({ queryKey: ['orders/list'] });
  }

  updateQuery(order: Order, isNew?: boolean) {
    const todayData = this.queryClient.getQueryData<Order[]>(['orders/daily', 'today']);
    const listData = this.queryClient.getQueryData<InfiniteData<Order[]>>(['orders/list']);
    if (todayData) {
      const copy = [...todayData];
      if (isNew) {
        if (order.isManual) order.waiter = this.auth.instantUser!;
        if (!copy.find((x) => x.id === order.id)) copy.unshift(order);
      } else {
        const existId = copy.findIndex((x) => x.id === order.id);
        if (existId > -1) {
          copy[existId] = order;
        }
      }
      this.queryClient.setQueryData(['orders/daily', 'today'], copy);
    }

    if (listData?.pages?.length) {
      const copy = { ...listData };
      if (isNew) {
        if (order.isManual) order.waiter = this.auth.instantUser!;
        if (!copy.pages[0]?.find((x) => x.id === order.id)) copy.pages[0].unshift(order);
      } else {
        const pageIndex = copy.pages.findIndex((x) => x.find((x) => x.id === order.id));
        if (pageIndex > -1) {
          const existId = copy.pages[pageIndex].findIndex((x) => x.id === order.id);
          if (existId > -1) {
            copy.pages[pageIndex][existId] = order;
          }
        }
      }
      this.queryClient.setQueryData(['orders/list'], copy);
    }
  }

  async merge(orders: Order[]) {
    try {
      const order = await this.http
        .post<Order>(
          `orders/merge`,
          orders.map((x) => x.id),
        )
        .toPromise();
      this.invalidateTodayQuery();
    } catch (error) {
    } finally {
      // order._changingState = false;
    }
  }

  async setDetails(order: Order, details: OrderDetails) {
    try {
      const result = await this.http.put<Order>(`orders/details/${order.id}`, details).toPromise();
      if (result) order.details = result.details;
    } catch (error) {}
  }

  async sendLinkToCustomer(orderId: string) {
    await this.http.get(`orders/sendLinkToCustomer/${orderId}`).toPromise();
    this.snack.open(this.translate.instant('app.smsSent'), '', { panelClass: 'success' });
  }

  async sendLinkToPayk(orderId: string, phone: string) {
    await this.http.get(`orders/sendLinkToPeyk/${orderId}/${phone}`).toPromise();
    this.snack.open(this.translate.instant('app.smsSent'), '', { panelClass: 'success' });
  }

  async settlement(order: Order, dto: ManualSettlementDto): Promise<void> {
    try {
      order._settlementing = true;
      const res = await this.http.post<Order>(`orders/manualSettlement`, dto).toPromise();
      if (res) {
        order.paymentType = dto.type;
        order.details.posPayed = dto.posPayed;
        order.items = res.items;
        order.totalPrice = res.totalPrice;
      }
      this.updateQuery(order);
    } catch (error: any) {
      throw new Error(error);
    } finally {
      order._settlementing = false;
      this.updateQuery(order);
    }
  }

  async setCustomer(order: Order, memberId: string): Promise<Order | undefined> {
    order._settingCustomer = true;
    try {
      const savedOrder = await this.http.get<Order>(`orders/setCustomer/${order.id}/${memberId}`).toPromise();
      if (savedOrder) {
        order.customer = savedOrder.customer;
        this.updateQuery(order);
        return order;
      }
    } catch (error) {
    } finally {
      order._settingCustomer = false;
    }
    return;
  }

  async remove(order: Order, description?: string) {
    const params: any = {};
    if (description) params.description = description;
    await this.http
      .delete(`orders/${order.id}`, {
        params,
      })
      .toPromise();
    order.deletedAt = new Date();
    order.state = OrderState.Canceled;
    this.updateQuery(order);
  }
}

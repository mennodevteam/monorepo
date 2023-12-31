import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private translate: TranslateService,
    private snack: MatSnackBar,
    private shop: ShopService
  ) {}

  async filter(dto: FilterOrderDto) {
    const orders = await this.http.post<Order[]>(`orders/filter`, dto).toPromise();
    if (orders) {
      for (const o of orders) {
        if (o.details?.table) {
          const table = this.shop.shop?.details?.tables?.find((x) => x.code === o.details?.table);
          if (table) {
            o.details.table = `${o.details.table} (${table.title})`;
          }
        }
      }
    }
    return orders;
  }

  async save(dto: OrderDto) {
    const order = await this.http.post<Order>(`orders`, dto).toPromise();
    return order;
  }

  async getById(id: string) {
    return this.http.get<Order>(`orders/panel/${id}`).toPromise();
  }

  async report(dto: OrderReportDto) {
    return this.http
      .post<{ [key: string]: { count: number; sum: number } }>(`orders/report`, dto)
      .toPromise();
  }

  async changeState(order: Order, state: OrderState) {
    try {
      order._changingState = true;
      const result = await this.http.get<Order>(`orders/changeState/${order.id}/${state}`).toPromise();
      order.state = state;
      if (result?.waiter) order.waiter = this.auth.instantUser!;
    } catch (error) {
    } finally {
      order._changingState = false;
    }
  }

  async merge(orders: Order[]) {
    try {
      const order = await this.http
        .post<Order>(
          `orders/merge`,
          orders.map((x) => x.id)
        )
        .toPromise();
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
    } catch (error: any) {
      throw new Error(error);
    } finally {
      order._settlementing = false;
    }
  }

  async setCustomer(order: Order, memberId: string): Promise<Order | undefined> {
    order._settingCustomer = true;
    try {
      const savedOrder = await this.http.get<Order>(`orders/setCustomer/${order.id}/${memberId}`).toPromise();
      if (savedOrder) {
        order.customer = savedOrder.customer;
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
  }
}

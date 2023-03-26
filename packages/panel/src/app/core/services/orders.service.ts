import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  FilterOrderDto,
  ManualSettlementDto,
  Order,
  OrderDto,
  OrderReportDto,
  OrderState,
} from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  async filter(dto: FilterOrderDto) {
    const orders = await this.http.post<Order[]>(`orders/filter`, dto).toPromise();
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
}

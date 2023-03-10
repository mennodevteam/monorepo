import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterOrderDto, Order, OrderDto, OrderState } from '@menno/types';
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
}

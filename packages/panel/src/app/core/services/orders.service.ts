import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private http: HttpClient) {}

  async getOrders(date: Date) {
    const orders = await this.http.post<Order[]>(`orders/filter`, {}).toPromise();
    return orders;
  }
}

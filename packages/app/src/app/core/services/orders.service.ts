import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order, OrderDto } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private http: HttpClient) {}

  async save(dto: OrderDto) {
    const order = await this.http.post(`orders`, dto).toPromise();
    return order;
  }

  list(skip?: number) {
    return this.http.get<Order[]>(`orders`, {
      params: {
        skip: skip || 0,
      },
    });
  }
}

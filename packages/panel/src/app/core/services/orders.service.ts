import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterOrderDto, Order } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private http: HttpClient) {}

  async filter(dto: FilterOrderDto) {
    const orders = await this.http.post<Order[]>(`orders/filter`, dto).toPromise();
    return orders;
  }
}

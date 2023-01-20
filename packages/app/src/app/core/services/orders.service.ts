import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OrderDto } from '@menno/types';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(
    private http: HttpClient,
  ) { }

  async save(dto: OrderDto) {
    const order = await this.http.post(`orders`, dto).toPromise();
    return order;
  }
}

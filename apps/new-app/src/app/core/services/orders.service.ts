import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order, OrderDto } from '@menno/types';
import { PayService } from './pay.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(
    private http: HttpClient,
    private payService: PayService,
  ) {}

  async save(dto: OrderDto) {
    const order = await this.http.post<Order>(`orders`, dto).toPromise();
    return order;
  }

  list(skip?: number) {
    return this.http.get<Order[]>(`orders`, {
      params: {
        skip: skip || 0,
      },
    });
  }

  getById(id?: string) {
    return this.http.get<Order>(`orders/${id}`);
  }

  async payAndAddOrder(dto: OrderDto) {
    const link: string | undefined = await this.http
      .post('payments/addOrder', dto, {
        responseType: 'text',
      })
      .toPromise();

    if (link === '0') {
      return this.save(dto);
    } else if (link) await this.payService.redirect(link);
    return;
  }

  async payOrder(orderId: string) {
    const link: string | undefined = await this.http
      .get(`payments/payOrder/${orderId}`, {
        responseType: 'text',
      })
      .toPromise();

    if (link) await this.payService.redirect(link);
  }
}

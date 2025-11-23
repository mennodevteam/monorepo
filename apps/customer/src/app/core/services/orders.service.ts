import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Order, OrderDto, StatAction } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PayService } from './pay.service';
import { MenuStatService } from './menu-stat.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(
    private http: HttpClient,
    private payService: PayService,
    private snack: MatSnackBar,
    private menuStat: MenuStatService,
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

  async payAndAddOrder(dto: OrderDto, total?: number) {
    const link: string | undefined = await this.http
      .post('payments/addOrder', dto, {
        responseType: 'text',
      })
      .toPromise();

    if (link === '0') {
      return this.save(dto);
    } else if (link) {
      this.snack.open('در حال انتقال به بانک...', '', { duration: 4000 });
      this.menuStat.send(StatAction.GoToBank, { value: total });
      await this.payService.redirect(link);
    }
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

import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Order, ThirdPartyApp, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

const BASE_API = environment.alopeykBaseUrl;

export type AlopeykStatus =
  | 'new'
  | 'searching'
  | 'cancelled'
  | 'expired'
  | 'accepted'
  | 'picking'
  | 'delivering'
  | 'delivered'
  | 'finished';
export type DeliveryOrder = {
  id: number;
  status: AlopeykStatus;
  price: number;
  orderId?: string;
  qNumber?: string;
  createdAt: Date;
};

@Injectable({
  providedIn: 'root',
})
export class AlopeykService {
  orders = new BehaviorSubject<DeliveryOrder[]>([]);
  constructor(private shopService: ShopService, private http: HttpClient) {}

  private get origin() {
    return [this.shopService.shop?.latitude, this.shopService.shop?.longitude];
  }

  private get token() {
    return this.shopService.shop?.thirdParties?.find(x => x.app === ThirdPartyApp.Alopeyk)?.token;
  }

  async addOrder(dest: [number, number], order?: Order): Promise<DeliveryOrder | undefined> {
    const res: any = await this.http
      .post(
        `${BASE_API}/orders`,
        {
          transport_type: 'motorbike',
          addresses: [
            {
              type: 'origin',
              lat: this.origin[0],
              lng: this.origin[1],
              description: this.shopService.shop?.address,
              person_fullname: this.shopService.shop?.address,
              person_phone: this.shopService.shop?.phones.join(', '),
            },
            {
              type: 'destination',
              lat: dest[0],
              lng: dest[1],
              description: order?.address?.description,
              person_fullname: order?.customer ? User.fullName(order.customer) : undefined,
              person_phone: order?.customer?.mobilePhone,
            },
          ],
          extra_params: JSON.stringify({
            orderId: order?.id,
            qNumber: order?.qNumber,
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      )
      .toPromise();

    if (res?.status === 'success') {
      const order = res.object;
      return {
        id: order.id,
        createdAt: new Date(order.created_at),
        price: order.price,
        status: order.status,
        orderId: order.extra_params ? JSON.parse(order.extra_params).orderId : undefined,
        qNumber: order.extra_params ? JSON.parse(order.extra_params).qNumber : undefined,
      };
    }
    return;
  }

  async calcPrice(dest: [number, number]): Promise<number | undefined> {
    const res: any = await this.http
      .post(
        `${BASE_API}/orders/price/calc`,
        {
          transport_type: 'motorbike',
          addresses: [
            {
              type: 'origin',
              lat: this.origin[0],
              lng: this.origin[1],
            },
            {
              type: 'destination',
              lat: dest[0],
              lng: dest[1],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      )
      .toPromise();

    if (res?.status === 'success') {
      return res.object.price;
    }
    return;
  }

  async loadOrders() {
    const res: any = await this.http
      .get(`${BASE_API}/orders`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();

    if (res?.status === 'success') {
      const orders = res.object.items;
      this.orders.next(
        orders.map((order: any) => ({
          id: order.id,
          createdAt: new Date(order.created_at),
          price: order.price,
          status: order.status,
          orderId: order.extra_params ? JSON.parse(order.extra_params).orderId : undefined,
          qNumber: order.extra_params ? JSON.parse(order.extra_params).qNumber : undefined,
        }))
      );
    }
  }

  async getOrderDetails(id: number) {
    const res: any = await this.http
      .get(`${BASE_API}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();

    if (res?.status === 'success') {
      const order = res.object;
      return {
        id: order.id,
        createdAt: new Date(order.created_at),
        price: order.price,
        status: order.status,
        orderId: order.extra_params ? JSON.parse(order.extra_params).orderId : undefined,
        qNumber: order.extra_params ? JSON.parse(order.extra_params).qNumber : undefined,
      };
    }
    return;
  }

  async cancelOrder(id: number) {
    const res: any = await this.http
      .get(`${BASE_API}/orders/${id}/cancel`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })
      .toPromise();
  }
}

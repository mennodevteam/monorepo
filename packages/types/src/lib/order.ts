import { Address } from './address';
import { DiscountCoupon } from './discount-coupon';
import { OrderItem } from './order-item';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderReview } from './order-review';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Payment } from './payment';
import { Shop } from './shop';
import { User } from './user';
export interface OrderDetails {
  customerPhone?: string;
  table?: string;
  posPayed?: number[];
  deletionReason?: string;
  currency?: string;
  deliveryId?: string | null;
  itemChanges?: {
    title: string;
    change: number;
  }[][];
  estimateCompletedAt?: Date;
}

export class Order {
  id: string;
  customer?: User;
  creator: User;
  waiter?: User;
  qNumber?: number;
  mergeTo?: Order;
  mergeFrom?: Order[];
  shop?: Shop;
  state: OrderState;
  type: OrderType;
  address?: Address;
  discountCoupon?: DiscountCoupon;
  paymentType: OrderPaymentType;
  note?: string;
  isManual: boolean;
  items: OrderItem[];
  totalPrice: number;
  reviews: OrderReview[];
  thirdPartyId?: string;
  packOrderId?: string;
  payment?: Payment;
  details: OrderDetails;
  _groupOffer?: Order[];
  _changingState?: boolean;
  _settlementing?: boolean;
  _settingCustomer?: boolean;
  _selected: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  static sum(order: Order) {
    let sum = 0;
    const productItems = order.items.filter((x) => !x.isAbstract);
    for (const i of productItems) {
      sum += i.quantity * i.price;
    }
    return sum;
  }

  static abstractItems(Order: Order) {
    try {
      return Order.items.filter((x) => x.isAbstract);
    } catch (error) {
      return [];
    }
  }

  static productItems(order: Order) {
    try {
      return order.items.filter((x) => !x.isAbstract);
    } catch (error) {
      return [];
    }
  }

  static total(order: Order) {
    return Math.max(order.totalPrice, 0);
  }

  static getLink(orderId: string, shop: Shop, appOrigin: string, orderDetailsPath: string) {
    const shopLink = Shop.appLink(shop, appOrigin);
    return `${shopLink}${orderDetailsPath}/${orderId}`;
  }

  static getDefaultStates(order: Order) {
    switch (order?.type) {
      case OrderType.Delivery:
        return [OrderState.Pending, OrderState.Processing, OrderState.Shipping, OrderState.Completed];
      case OrderType.DineIn:
      case OrderType.Takeaway:
        return [OrderState.Pending, OrderState.Processing, OrderState.Ready, OrderState.Completed];
      default:
        return [];
    }
  }

  static nextState(order?: Order, states?: OrderState[]) {
    if (order) {
      if (!states) states = Order.getDefaultStates(order);
      const selectedIndex = states.indexOf(order.state);
      if (selectedIndex < states.length - 1) {
        return states[selectedIndex + 1];
      }
    }
    return;
  }

  static merge(orders: Order[], baseOrder: Order) {
    let newOrder: Partial<Order> = { ...baseOrder, mergeFrom: [baseOrder] };
    Object.keys(newOrder).forEach((key) => {
      const field: keyof Order = key as keyof Order;
      if (newOrder[field] == undefined) delete newOrder[field];
    });
    for (const o of orders) {
      if (o.id === baseOrder.id || o.deletedAt) continue;
      newOrder = { ...o, ...newOrder };
      newOrder.totalPrice! += o.totalPrice;
      newOrder.mergeFrom?.push(o);
      if (newOrder.id) delete newOrder.id;

      for (const item of o.items) {
        const exist = newOrder.items!.find(
          (x) => x.title === item.title && (x.isAbstract === item.isAbstract || x.price === item.price)
        );
        if (exist) {
          if (item.isAbstract) {
            exist.price += item.price;
          } else {
            exist.quantity += item.quantity;
          }
        } else {
          newOrder.items!.push(item);
        }
      }
    }
    return newOrder;
  }
}

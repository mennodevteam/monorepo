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
  mergeFrom?: string[];
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
  packOrderId?: string;
  payment?: Payment;
  details: OrderDetails;
  _groupOffer?: Order[];
  _changingState?: boolean;
  _settlementing?: boolean;
  _settingCustomer?: boolean;
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
}

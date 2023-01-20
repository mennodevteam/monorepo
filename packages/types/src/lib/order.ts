import { Menu } from './menu';
import { OrderItem } from './order-item';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderReview } from './order-review';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Shop } from './shop';
import { User } from './user';
export interface OrderDetails {
  customerPhone?: string;
  table?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryAreaId?: number;
  discountCouponId?: string;
  posPayed?: number[];
  deletionReason?: string;
  currency?: string;
  itemChanges?: {
    title: string;
    change: number;
  }[][];
  estimateCompletedAt?: Date;
}

export class Order {
  id: string;
  customer: User;
  creator: User;
  waiter: User;
  qNumber?: number;
  mergeTo?: Order;
  mergeFrom?: string[];
  shop?: Shop;
  state: OrderState;
  type: OrderType;
  paymentType: OrderPaymentType;
  note?: string;
  isManual: boolean;
  items: OrderItem[];
  totalPrice: number;
  reviews: OrderReview[];
  packOrderId?: string;
  details: OrderDetails;
  _groupOffer?: Order[];
  createdAt: Date;
  deletedAt: Date;

  static sum(items: OrderItem[]) {
    let sum = 0;
    const productItems = items.filter((x) => !x.isAbstract);
    for (const i of productItems) {
      sum += i.quantity * i.price;
    }
    return sum;
  }

  static abstractItems(menu: Menu, items: OrderItem[]) {
    const costs = menu?.costs?.filter((x) => !x.showOnItem) || [];
    const abstractItems: OrderItem[] = [];
    const sum = this.sum(items);
    for (const c of costs) {
      let price = 0;
      if (c.fixedCost) price += c.fixedCost;
      if (c.percentageCost) {
        const dis = (sum * c.percentageCost) / 100;
        price += Math.floor(dis / 500) * 500;
      }
      abstractItems.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price,
        title: c.title,
      });
    }
    return abstractItems;
  }

  static total(menu: Menu, items: OrderItem[]) {
    let total = this.sum(items);
    for (const i of this.abstractItems(menu, items)) {
      total += i.price;
    }
    return total;
  }
}

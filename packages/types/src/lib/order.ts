import { OrderItem } from './order-item';
import { OrderReview } from './order-review';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Shop } from './shop';
import { User } from './user';
export interface OrderDetails {
  customerPhone: string;
  table: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryAreaId?: number;
  discountCouponId?: string;
  paymentType: 'online' | 'cash' | 'clubWallet';
  posPayed: number[];
  deletionReason: string;
  currency?: string;
  note?: string;
  itemChanges?: {
    title: string;
    change: number;
  }[][];
  estimateCompletedAt?: Date;
}

export class Order {
  id: string;
  customerId?: string;
  customer: User;
  creator: User;
  qNumber?: number;
  creatorId?: string;
  mergeTo?: Order;
  mergeFrom?: string[];
  shop?: Shop;
  state: OrderState;
  type: OrderType;
  isManual: boolean;
  isPayed: boolean;
  items: OrderItem[];
  totalPrice: number;
  reviews: OrderReview[];
  packOrderId?: string;
  details: OrderDetails;
  _groupOffer?: Order[];
  createdAt: Date;
  deletedAt: Date;
}

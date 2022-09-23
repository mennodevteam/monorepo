import { Order } from './order';

export class OrderReview {
  id: number;
  userId: string;
  rate: number;
  description: string;
  order: Order;
}

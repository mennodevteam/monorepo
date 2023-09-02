import { Order } from './order';
import { User } from './user';

export class OrderReview {
  id: number;
  user: User;
  rate: number;
  description: string;
  order: Order;
}

import { Order } from './order';
import { Shop } from './shop';
import { User } from './user';

export enum ChatType {
  Send = 'SEND',
  Receive = 'RECEIVE',
}

export class Chat {
  id: string;
  user?: User;
  shop: Shop;
  text: string;
  type: ChatType;
  createdAt: Date;
  order?: Order;
  seen: boolean;
}

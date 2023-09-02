import { Shop } from "./shop";
import { User } from "./user";

export class Ding {
  id: string;
  customer: User;
  description?: string;
  table: string;
  createdAt: Date;
  shop: Shop;
}
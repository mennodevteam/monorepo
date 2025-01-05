import { Product } from "./product";
import { Shop } from "./shop";

export class BasalamProduct {
  id: number;
  shop: Shop;
  product: Product;
  sync?: {
    title?: boolean;
    description?: boolean;
    price?: boolean;
    images?: boolean;
  };
  updatedAt?: Date;
  syncedAt?: Date;
}

import { ProductItem } from './order.dto';
import { Product } from './product';
import { Status } from './status.enum';

export class ProductVariant {
  id: number;
  title: string;
  description?: string;
  price: number;
  status: Status;
  stock?: number | null;
  position?: number;
  _orderItem?: ProductItem;
  product: Product;
  createdAt: Date;
  deletedAt?: Date;
  updatedAt?: Date;

  static sort(variants: ProductVariant[]) {
    variants.sort((a, b) => {
      if (a.position != undefined && b.position == undefined) return -1;
      if (b.position != undefined && a.position == undefined) return 1;
      if (a.position == b.position && a.createdAt && b.createdAt) {
        return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
      }
      if (a.position != undefined && b.position != undefined) return a.position - b.position;
      return 1;
    });
  }
}

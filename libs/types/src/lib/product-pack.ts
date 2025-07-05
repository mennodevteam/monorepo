import { Image } from './image';
import { Menu } from './menu';
import { Product } from './product';
import { ProductVariant } from './product-variant';
import { Status } from './status.enum';

export class ProductPack {
  id: string;
  title: string;
  description?: string;
  price: number;
  status: Status;
  position?: number;
  imageFiles?: Image[];
  items: ProductPackItem[];
  menu: Menu;
}

export class ProductPackItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

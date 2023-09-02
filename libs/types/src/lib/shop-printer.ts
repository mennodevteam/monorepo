import { Shop } from './shop';
import { ShopPrintView } from './shop-print-view';

export class ShopPrinter {
  id: string;
  shop: Shop;
  name: string;
  config: any;
  printViews: ShopPrintView[];
  createdAt: Date;
  deletedAt: Date;
}

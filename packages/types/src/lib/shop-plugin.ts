import { Status } from './status.enum';
import { Shop } from './shop';
import { Plugin } from './plugin.enum';

export class ShopPlugins {
  id: number;
  expiredAt: Date;
  status: Status;
  shop: Shop;
  plugins: Plugin[];
}

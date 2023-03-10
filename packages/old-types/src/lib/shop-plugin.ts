import { Status } from "./status.enum";
import { Shop } from "./shop";
import { Plugin } from "./plugin.enum";

export class ShopPlugin {
    id: number;
    expiredAt: Date;
    status: Status;
    shop: Shop;
    plugin: Plugin;
}
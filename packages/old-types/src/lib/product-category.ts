import { Status } from "./status.enum";
import { Menu } from "./menu";
import { Product } from "./product";
import { OrderType } from "./order-type.enum";

export class ProductCategory {
    id: number;
    title: string;
    status: Status;
    orderTypes: OrderType[];
    products?: Product[];
    position?: number;
    parent?: string;
    star?: number;
    menu: Menu;
    createdAt?: Date;
    deletedAt?: Date;
}
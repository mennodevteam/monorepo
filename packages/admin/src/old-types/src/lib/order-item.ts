import { Order } from "./order";
import { Product } from "./product";

export class OrderItem {
    id: string;
    order: Order;
    product?: Product;
    title?: string;
    price: number;
    isAbstract: boolean;
    quantity: number;
    details?: any;
}
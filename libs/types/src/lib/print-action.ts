import { Order } from "./order";
import { OrderType } from "./order-type.enum";
import { PrintType } from "./print-type.enum";
import { Shop } from "./shop";
import { ShopPrintView } from "./shop-print-view";

export class PrintAction {
    id: string;
    printerName: string;
    printerTitle:string;
    count: number;
    type: PrintType;
    shop: Shop;
    data: {
        shopName: string;
        items: {
            title: string;
            price: number;
            isAbstract: boolean;
            quantity: number;
        }[];
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        shopAddress: string;
        shopPhones: string[];
        shopUrl: string;
        table: string;
        date: Date;
        type: OrderType;
        qNumber: number;
        totalPrice: number;
        currency: string;
        descriptions: string[];
    }
    waitForLocal: boolean;
    isPrinted: boolean;
    order: Order;
    printView: ShopPrintView;
    failedCount: number;
    createdAt: Date;
}
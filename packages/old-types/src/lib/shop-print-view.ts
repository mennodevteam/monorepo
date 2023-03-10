import { PrintType } from "./print-type.enum";
import { ShopPrinter } from "./shop-printer";

export class ShopPrintView {
    id: string;
    printer: ShopPrinter;
    title: string;
    type: PrintType;
    defaultCount: number;
    includeProductCategoryIds: number[];
    autoPrintOnNewOrder: boolean;
    autoPrintOnOnlinePayment: boolean;
    autoPrintOnManualSettlement: boolean;
    createdAt: Date;
    deletedAt: Date;
}
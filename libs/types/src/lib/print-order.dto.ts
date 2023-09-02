export class PrintOrderDto {
    orderId: string;
    waitForLocal: boolean;
    prints: {
        printViewId: string;
        count?: number;
    }[];
}
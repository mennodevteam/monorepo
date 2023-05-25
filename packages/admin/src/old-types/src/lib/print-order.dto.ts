export class PrintOderDto {
    orderId: string;
    waitForLocal: boolean;
    prints: {
        printViewId: string;
        count?: number;
    }[];
}
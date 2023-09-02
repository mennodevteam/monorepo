import { Shop } from "./shop";

export class WindowsLocalNotification {
    id: number;
    title: string;
    description: string;
    shop: Shop;
    failedCount: number;
    isNotified: boolean;
    photoName:string;
    createdAt: Date;
}
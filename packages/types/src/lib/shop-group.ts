import { Shop } from "./shop";

export class ShopGroup {
    id: string;
    code: string;
    title: string;
    description: string;
    listName: string;
    logo: string;
    details: any;
    shops: Shop[];
}
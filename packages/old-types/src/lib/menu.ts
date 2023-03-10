import { MenuCost } from "./menu-cost";
import { ProductCategory } from "./product-category";

export class Menu {
    id: string;
    title?: string;
    currency?: string;
    costs: MenuCost[];
    categories?: ProductCategory[];
}
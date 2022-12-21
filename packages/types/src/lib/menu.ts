import { MenuCost } from './menu-cost';
import { ProductCategory } from './product-category';

export class Menu {
  id: string;
  title?: string;
  currency?: string;
  costs: MenuCost[];
  categories?: ProductCategory[];

  static sortCategories(categories: ProductCategory[]) {
    categories.sort((a, b) => {
      if (a.position != undefined && b.position == undefined) return -1;
      if (b.position != undefined && a.position == undefined) return 1;
      if (a.position == b.position && a.createdAt && b.createdAt) {
        return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
      }
      if (a.position != undefined && b.position != undefined) return a.position - b.position;
      return 1;
    });
  }
}

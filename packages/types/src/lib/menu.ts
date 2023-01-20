import { MenuCost } from './menu-cost';
import { Product } from './product';
import { ProductCategory } from './product-category';

export enum MenuViewType {
  Manual,
  Card,
  Grid,
}

export class Menu {
  id: string;
  title?: string;
  currency?: string;
  costs: MenuCost[];
  categories?: ProductCategory[];
  viewType: MenuViewType;
  cols: number;

  static setRefsAndSort(menu: Menu) {
    if (menu?.categories) {
      menu.categories = menu.categories.filter((x) => x.products?.length);
      ProductCategory.sort(menu.categories);
      for (const cat of menu.categories) {
        cat.costs = menu.costs?.filter(
          (x) =>
            (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
            x.includeProductCategory.find((y) => y.id === cat.id)
        );
        if (cat.products) {
          Product.sort(cat.products);
          for (const p of cat.products) {
            p.category = cat;
            p.costs = menu.costs?.filter(
              (x) =>
                (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
                x.includeProductCategory?.find((y) => y.id === p.category.id) ||
                x.includeProduct?.find((y) => y.id === p.id)
            );
          }
        }
      }
    }
  }

  static getProductById(menu: Menu, productId: string) {
    try {
      if (menu && menu.categories) {
        for (const cat of menu.categories) {
          if (cat.products) {
            for (const prod of cat.products) {
              if (prod.id === productId) return prod;
            }
          }
        }
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}

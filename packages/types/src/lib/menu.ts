import { MenuCost } from './menu-cost';
import { OrderType } from './order-type.enum';
import { Product } from './product';
import { ProductCategory } from './product-category';
import { Status } from './status.enum';

export class Menu {
  id: string;
  title?: string;
  currency?: string;
  costs: MenuCost[];
  categories?: ProductCategory[];

  static setRefsAndSort(menu: Menu, orderType?: OrderType, showInactive?: boolean, showEmpty?: boolean) {
    if (orderType != undefined) {
      menu.categories = menu.categories?.filter(
        (x) =>
          (showInactive || x.status !== Status.Inactive) && x.orderTypes && x.orderTypes.includes(orderType)
      );
      menu.costs = menu.costs?.filter(
        (x) =>
          (showInactive || x.status !== Status.Inactive) && x.orderTypes && x.orderTypes.includes(orderType)
      );
    }
    if (menu.costs) {
      MenuCost.sort(menu.costs);
    }
    if (menu?.categories) {
      ProductCategory.sort(menu.categories);
      for (const cat of menu.categories) {
        if (orderType != undefined) {
          cat.products = cat.products?.filter(
            (x) =>
              (showInactive || x.status !== Status.Inactive) &&
              x.orderTypes &&
              x.orderTypes.includes(orderType)
          );
        }
        cat.costs = menu.costs?.filter(
          (x) =>
            (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
            x.includeProductCategory.find((y) => y.id === cat.id)
        );
        if (cat.products) {
          Product.sort(cat.products);
          for (const p of cat.products) {
            p.category = cat;
            if (
              cat.status === Status.Inactive ||
              (cat.status === Status.Blocked && p.status === Status.Active)
            )
              p.status = cat.status;

            p.costs = menu.costs?.filter(
              (x) =>
                (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
                x.includeProductCategory?.find((y) => y.id === p.category.id) ||
                x.includeProduct?.find((y) => y.id === p.id)
            );
          }
        }
        cat.products = cat.products?.filter((x) => x.status !== Status.Inactive);
      }
      menu.categories = menu.categories.filter((x) => showEmpty || x.products?.length);
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

  static getProductList(menu: Menu) {
    const products: Product[] = [];
    if (menu.categories) {
      for (const cat of menu.categories) {
        if (cat.products) products.push(...cat.products);
      }
    }
    return products;
  }

  static isBasedOrderType(menu: Menu) {
    if (menu.costs.find((x) => x.orderTypes.length > 0 && x.orderTypes.length < 3)) return true;
    if (menu.categories?.find((x) => x.orderTypes.length > 0 && x.orderTypes.length < 3)) return true;
    if (Menu.getProductList(menu).find((x) => x.orderTypes.length > 0 && x.orderTypes.length < 3))
      return true;
    return false;
  }
}

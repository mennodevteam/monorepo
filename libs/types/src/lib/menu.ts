import { MenuCost } from './menu-cost';
import { OrderItem } from './order-item';
import { OrderType } from './order-type.enum';
import { Product } from './product';
import { ProductCategory } from './product-category';
import { ProductVariant } from './product-variant';
import { Status } from './status.enum';

export class Menu {
  id: string;
  title?: string;
  currency?: string;
  costs: MenuCost[];
  categories?: ProductCategory[];

  static setRefsAndSort(
    menu: Menu,
    orderType?: OrderType,
    showInactive?: boolean,
    showEmpty?: boolean,
    star?: number,
    isManual?: boolean,
  ) {
    if (star != undefined) {
      menu.categories = menu.categories?.filter((x) => !x.star || star >= x.star);
    }

    if (orderType != undefined) {
      menu.categories = menu.categories?.filter(
        (x) =>
          (showInactive || x.status !== Status.Inactive) && x.orderTypes && x.orderTypes.includes(orderType),
      );
      menu.costs = menu.costs?.filter(
        (x) =>
          (showInactive || x.status !== Status.Inactive) &&
          x.orderTypes &&
          x.orderTypes.includes(orderType) &&
          (isManual == undefined || x.isManual == null || isManual === x.isManual),
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
              x.orderTypes.includes(orderType),
          );
        }
        cat.costs = menu.costs?.filter(
          (x) =>
            (!x.includeProduct?.length && !x.includeProductCategory?.length) ||
            x.includeProductCategory.find((y) => y.id === cat.id),
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
                x.includeProduct?.find((y) => y.id === p.id),
            );

            if (p.variants) {
              ProductVariant.sort(p.variants);
              for (const v of p.variants) {
                v.product = p;
                if (
                  p.variants.length == 1 ||
                  p.status === Status.Inactive ||
                  (p.status === Status.Blocked && v.status === Status.Active)
                )
                  v.status = p.status;
              }
            }
          }
        }
        cat.products = cat.products?.filter((x) => showInactive || x.status !== Status.Inactive);
      }
      menu.categories = menu.categories.filter((x) => showEmpty || x.products?.length);
    }
  }

  static search(menu: Menu, query: string): ProductCategory[] {
    const cats: ProductCategory[] = [];
    if (menu.categories) {
      for (const cat of menu.categories) {
        if (cat.title.search(query) > -1) cats.push(cat);
        else {
          const products = cat.products?.filter((x) => x.title.search(query) > -1);
          if (products?.length)
            cats.push({
              ...cat,
              products,
            });
        }
      }
    }
    return cats;
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

  static getProductVariantById(menu: Menu, variantId: number) {
    try {
      if (menu && menu.categories) {
        for (const cat of menu.categories) {
          if (cat.products) {
            for (const prod of cat.products) {
              if (prod.variants) {
                for (const v of prod.variants) {
                  if (v.id === variantId) return v;
                }
              }
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

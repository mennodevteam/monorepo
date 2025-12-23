import { inject, Injectable } from '@angular/core';
import { Product, ProductCategory, Menu } from '@menno/types';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  private readonly menuService = inject(MenuService);

  /**
   * Get the route link for a category
   * Uses slug if available, otherwise falls back to id
   */
  getCategoryLink(category: ProductCategory | number): string {
    const categoryObj = typeof category === 'number' 
      ? this.menuService.data()?.categories?.find(c => c.id === category)
      : category;

    if (!categoryObj) {
      return '/categories';
    }

    if (categoryObj.slug) {
      return `/categories/${categoryObj.slug}`;
    }

    return `/categories/${categoryObj.id}`;
  }

  /**
   * Get the route link for a product
   * Uses slug if available, otherwise falls back to id
   * Requires category for the route structure
   */
  getProductLink(product: Product | string, category?: ProductCategory | number): string {
    const menu = this.menuService.data();
    const productObj = typeof product === 'string'
      ? (menu ? Menu.getProductById(menu, product) : undefined)
      : product;

    if (!productObj) {
      return '/categories';
    }

    // Get category from product if not provided
    const categoryObj = category 
      ? (typeof category === 'number' 
          ? menu?.categories?.find(c => c.id === category)
          : category)
      : productObj.category;

    if (!categoryObj) {
      return '/categories';
    }

    const categoryPath = categoryObj.slug ? categoryObj.slug : categoryObj.id.toString();
    const productPath = productObj.slug ? productObj.slug : productObj.id;

    return `/categories/${categoryPath}/${productPath}`;
  }
}


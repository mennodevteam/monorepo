import { Menu, Product, ProductCategory } from '@menno/types';

export function getCategoryPath(category: ProductCategory): string {
  if (category.slug) {
    return `/categories/${category.slug}`;
  }
  return `/categories/${category.id}`;
}

export function getProductPath(product: Product, category?: ProductCategory | null): string {
  const categoryObj = category ?? product.category;
  if (!categoryObj) {
    return '/categories';
  }
  const categoryPath = categoryObj.slug ? categoryObj.slug : String(categoryObj.id);
  const productPath = product.slug ? product.slug : product.id;
  return `/categories/${categoryPath}/${productPath}`;
}

export function collectSitemapPaths(menu: Menu | undefined): string[] {
  if (!menu?.categories?.length) {
    return ['/categories'];
  }

  const paths = new Set<string>(['/', '/categories']);

  for (const category of menu.categories) {
    paths.add(getCategoryPath(category));
    for (const product of category.products ?? []) {
      paths.add(getProductPath(product, category));
    }
  }

  return [...paths];
}

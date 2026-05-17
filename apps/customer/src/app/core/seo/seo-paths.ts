import { Menu, Product, ProductCategory } from '@menno/types';

function pathSegment(slug: string | null | undefined, id: string | number): string {
  const normalizedSlug = slug?.trim();
  return normalizedSlug ? normalizedSlug : String(id);
}

/** Canonical / sitemap path for a category (slug when set, otherwise id). */
export function getCategoryPath(category: ProductCategory): string {
  return `/categories/${pathSegment(category.slug, category.id)}`;
}

/** Canonical / sitemap path for a product (slug when set, otherwise id). */
export function getProductPath(product: Product, category?: ProductCategory | null): string {
  const categoryObj = category ?? product.category;
  if (!categoryObj) {
    return '/categories';
  }
  return `/categories/${pathSegment(categoryObj.slug, categoryObj.id)}/${pathSegment(product.slug, product.id)}`;
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

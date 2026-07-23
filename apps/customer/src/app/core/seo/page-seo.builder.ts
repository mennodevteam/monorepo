import { Product, ProductCategory, Shop } from '@menno/types';
import { getFileUrl } from '../functions/get-file-url';
import { getCategoryPath } from './seo-paths';

export interface PageSeoConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'product';
}

function shopBrandName(shop: Shop): string {
  return shop.title?.trim() || shop.seo?.title?.trim() || 'فروشگاه';
}

function shopHomePageTitle(shop: Shop): string {
  return shop.seo?.title?.trim() || shop.title?.trim() || 'فروشگاه';
}

function shopDescription(shop: Shop): string {
  return shop.seo?.description?.trim() || shop.description?.trim() || shopBrandName(shop);
}

function shopImage(shop: Shop): string | undefined {
  const key = shop.logoImage?.md || shop.logo;
  return key ? getFileUrl(key) : undefined;
}

export function buildHomePageSeo(shop: Shop): PageSeoConfig {
  return {
    title: shopHomePageTitle(shop),
    description: shopDescription(shop),
    path: '/',
    image: shopImage(shop),
    type: 'website',
  };
}

export function buildCategoriesPageSeo(shop: Shop): PageSeoConfig {
  const name = shopBrandName(shop);
  return {
    title: `دسته‌بندی‌ها | ${name}`,
    description: `مشاهده تمام دسته‌بندی‌های ${name}`,
    path: '/categories',
    image: shopImage(shop),
    type: 'website',
  };
}

export function buildCategoryPageSeo(category: ProductCategory, shop: Shop): PageSeoConfig {
  const name = shopBrandName(shop);
  const categoryTitle = category.title?.trim() || 'دسته‌بندی';
  const description =
    category.description?.trim() ||
    `خرید از دسته ${categoryTitle} در ${name}`;
  const imageKey = category.imageFile?.md ?? category.imageFile?.sm;
  return {
    title: `دسته بندی ${categoryTitle} | ${name}`,
    description,
    path: getCategoryPath(category),
    image: imageKey ? getFileUrl(imageKey) : shopImage(shop),
    type: 'website',
  };
}

export function buildProductPageSeo(
  product: Product,
  shop: Shop,
  productPath: string,
): PageSeoConfig {
  const name = shopBrandName(shop);
  const productTitle = product.title?.trim() || 'محصول';
  const description =
    product.description?.trim() ||
    `خرید ${productTitle} از ${name}`;
  const imageFile = Product.mainImageFile(product);
  const imageKey = imageFile?.md ?? imageFile?.sm ?? imageFile?.xs;
  return {
    title: `${productTitle} | ${name}`,
    description,
    path: productPath,
    image: imageKey ? getFileUrl(imageKey) : shopImage(shop),
    type: 'product',
  };
}

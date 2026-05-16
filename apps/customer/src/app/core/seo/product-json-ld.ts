import { Product, ProductVariant, Shop } from '@menno/types';
import { getFileUrl } from '../functions/get-file-url';

function shopName(shop: Shop): string {
  return shop.seo?.title?.trim() || shop.title?.trim() || 'Shop';
}

function availabilityUrl(product: Product, variant?: ProductVariant): string {
  const unavailable = variant
    ? Product.isFinished(product, variant)
    : Product.isFinished(product);
  return unavailable ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
}

function buildOffer(
  product: Product,
  shop: Shop,
  pageUrl: string,
  price: number,
  name: string,
  variant?: ProductVariant,
): Record<string, unknown> {
  return {
    '@type': 'Offer',
    name,
    url: pageUrl,
    priceCurrency: 'IRR',
    price,
    availability: availabilityUrl(product, variant),
    seller: {
      '@type': 'Organization',
      name: shopName(shop),
    },
  };
}

function buildVariantOffers(
  product: Product,
  shop: Shop,
  pageUrl: string,
): Record<string, unknown>[] {
  const variants = product.variants ?? [];
  return variants.map((variant) =>
    buildOffer(
      product,
      shop,
      pageUrl,
      Product.totalPrice(product, variant),
      variant.title?.trim() || product.title,
      variant,
    ),
  );
}

function buildAggregateOffer(
  product: Product,
  shop: Shop,
  pageUrl: string,
  variantOffers: Record<string, unknown>[],
): Record<string, unknown> {
  const prices = variantOffers
    .map((offer) => offer['price'])
    .filter((price): price is number => typeof price === 'number' && price >= 0);

  const aggregate: Record<string, unknown> = {
    '@type': 'AggregateOffer',
    priceCurrency: 'IRR',
    offerCount: variantOffers.length,
    offers: variantOffers,
    seller: {
      '@type': 'Organization',
      name: shopName(shop),
    },
  };

  if (prices.length) {
    aggregate['lowPrice'] = Math.min(...prices);
    aggregate['highPrice'] = Math.max(...prices);
  }

  return aggregate;
}

export function buildProductJsonLd(product: Product, shop: Shop, pageUrl: string): Record<string, unknown> {
  const imageFile = Product.mainImageFile(product);
  const imageKey = imageFile?.md ?? imageFile?.sm ?? imageFile?.xs;
  const imageUrl = imageKey ? getFileUrl(imageKey) : undefined;
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.trim() || product.title,
    sku: product.id,
    url: pageUrl,
    offers: hasVariants
      ? buildAggregateOffer(product, shop, pageUrl, buildVariantOffers(product, shop, pageUrl))
      : buildOffer(product, shop, pageUrl, Product.totalPrice(product), product.title),
  };

  if (imageUrl) {
    jsonLd['image'] = imageUrl;
  }

  if (product.slug) {
    jsonLd['mpn'] = product.slug;
  }

  return jsonLd;
}

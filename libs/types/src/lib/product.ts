import { Status } from './status.enum';
import { ProductCategory } from './product-category';
import { MenuCost } from './menu-cost';
import { OrderType } from './order-type.enum';
import { ProductItem } from './order.dto';
import { ProductVariant } from './product-variant';
import { Image } from './image';
import { BillOfMaterial, BillOfProduct, Material } from './inventory';
import { ProductPackItem } from './product-pack';

export enum ProductType {
  Standard = 'standard',
  Pack = 'pack',
}

export class Product {
  id: string;
  title: string;
  description?: string;
  subcategories?: string[];
  price: number;
  type?: ProductType;
  status: Status;
  position?: number;
  category: ProductCategory;
  images?: string[];
  imageFiles?: Image[] | Image;
  orderTypes: OrderType[];
  packItems?: ProductPackItem[];
  details: any;
  stock?: number | null;
  costs?: MenuCost[];
  variants: ProductVariant[];
  productLabel?: string;
  maxBasket?: number;
  thirdPartyId?: string;
  slug?: string;
  relatedProductIds?: string[];
  _orderItem?: ProductItem;
  _changingStatus?: boolean;
  _priceLoading?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
  deletedAt?: Date;

  static sort(products: Product[]) {
    products.sort((a, b) => {
      if (a.position != undefined && b.position == undefined) return -1;
      if (b.position != undefined && a.position == undefined) return 1;
      if (a.position == b.position && a.createdAt && b.createdAt) {
        return new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf();
      }
      if (a.position != undefined && b.position != undefined) return a.position - b.position;
      return 1;
    });
  }

  static getPackPrice(product: Product, productVariant?: ProductVariant): number {
    const packItems = productVariant ? (productVariant.packItems ?? []) : (product.packItems ?? []);
    if (packItems.length === 0) return 0;
    return packItems.reduce((acc, item) => {
      const price = item.variant ? item.variant.price : (item.product?.price || 0);
      return acc + (price || 0) * item.quantity;
    }, 0);
  }

  static realPrice(product: Product, productVariant?: ProductVariant, round = 500) {
    let cost = 0;
    let price = productVariant ? productVariant.price : product.price;
    if (product.type === ProductType.Pack) {
      price = Product.getPackPrice(product, productVariant);
    }
    const showCosts = product.costs?.filter((x) => x.showOnItem && (x.fixedCost > 0 || x.percentageCost > 0));
    if (showCosts) {
      for (const c of showCosts) {
        if (c.fixedCost) cost += c.fixedCost;
        if (c.percentageCost) {
          const dis = (price * c.percentageCost) / 100;
          cost += dis;
        }
      }
    }
    const total = Math.floor((price + cost) / round) * round;
    return Math.max(total, 0);
  }

  static mainImageFile(product?: Product) {
    return Array.isArray(product?.imageFiles) ? product.imageFiles[0] : product?.imageFiles;
  }

  static totalPrice(product: Product, productVariant?: ProductVariant, round = 500) {
    let cost = 0;
    let price = productVariant ? productVariant.price : product.price;
    if (product.type === ProductType.Pack) {
      price = Product.getPackPrice(product, productVariant);
    }
    const showCosts = product.costs?.filter((x) => x.showOnItem);
    if (showCosts) {
      for (const c of showCosts) {
        if (c.fixedCost) cost += c.fixedCost;
        if (c.percentageCost) {
          const dis = (price * c.percentageCost) / 100;
          cost += dis;
        }
      }
    }
    const total = Math.floor((price + cost) / round) * round;
    return Math.max(total, 0);
  }

  static isFinished(product: Product, productVariant?: ProductVariant) {
    return (
      product.status === Status.Blocked ||
      productVariant?.status === Status.Blocked ||
      product.stock === 0 ||
      productVariant?.stock === 0
    );
  }

  static isUnavailable(product: Product) {
    const variants = product.variants ?? [];
    if (!variants.length) {
      return Product.isFinished(product);
    }
    return variants.every((variant) => Product.isFinished(product, variant));
  }

  static fixedDiscount(product: Product, productVariant?: ProductVariant) {
    const cost = Product.realPrice(product, productVariant) - Product.totalPrice(product, productVariant);
    if (cost > 0) return cost;
    return 0;
  }

  static percentageDiscount(product: Product, productVariant?: ProductVariant, round = 5) {
    const realPrice = Product.realPrice(product, productVariant);
    const cost = realPrice - Product.totalPrice(product, productVariant);
    if (cost > 0 && realPrice > 0) return Math.round(((cost / realPrice) * 100) / round) * round;
    return 0;
  }

  static hasDiscount(product: Product, productVariant?: ProductVariant) {
    if (Product.totalPrice(product, productVariant) < Product.realPrice(product, productVariant)) return true;
    return false;
  }
  static calculateCost(
    product: Product,
    productVariant: ProductVariant | undefined | null,
    allBoms: BillOfMaterial[],
    allPackItems?: any[],
  ) {
    const productId = typeof product === 'object' && product !== null ? product.id : product;
    const variantId = typeof productVariant === 'object' && productVariant !== null ? productVariant.id : productVariant;

    let packItems = (allPackItems && allPackItems.length > 0 && (
      'parentProduct' in allPackItems[0] ||
      'parentVariant' in allPackItems[0] ||
      (allPackItems[0] && ('product' in allPackItems[0] || 'variant' in allPackItems[0]))
    ))
      ? allPackItems.filter((item) => {
          const itemParentProductId = item.parentProduct && typeof item.parentProduct === 'object' ? item.parentProduct.id : item.parentProduct;
          const itemParentVariantId = item.parentVariant && typeof item.parentVariant === 'object' ? item.parentVariant.id : item.parentVariant;

          if (itemParentProductId || itemParentVariantId) {
            const matchParentVariant = itemParentVariantId && variantId && String(itemParentVariantId) === String(variantId);
            const matchParentProduct = itemParentProductId && productId && String(itemParentProductId) === String(productId);
            return (variantId && matchParentVariant) ||
                   (!variantId && matchParentProduct);
          }
          return false;
        })
      : [];

    if (packItems.length === 0) {
      packItems = productVariant ? (productVariant.packItems ?? []) : (product.packItems ?? []);
    }

    const isPack = (typeof product === 'object' && product !== null && product.type === ProductType.Pack) || packItems.length > 0;

    const boms = isPack ? [] : allBoms.filter((bom) => {
      const bomProductId = bom.product && typeof bom.product === 'object' ? bom.product.id : bom.product;
      const bomVariantId = bom.variant && typeof bom.variant === 'object' ? bom.variant.id : bom.variant;
      
      const matchProduct = bomProductId && productId && String(bomProductId) === String(productId);
      const matchVariant = (!bomVariantId && !variantId) || 
                           (bomVariantId && variantId && String(bomVariantId) === String(variantId));
      return matchProduct && matchVariant;
    });

    if (boms.length === 0 && packItems.length === 0) return null;

    const bomsCost = boms.length ? BillOfMaterial.calculateCost(boms) : 0;
    if (bomsCost === null) return null;

    let packCost = 0;
    for (const item of packItems) {
      try {
        const itemCost = Product.calculateCost(item.product, item.variant, allBoms, allPackItems);
        if (itemCost === null) return null;
        packCost += itemCost * item.quantity;
      } catch (error) {
        return null;
      }
    }
    return bomsCost + packCost;
  }

  static getAllMaterials(
    product: Product,
    productVariant: ProductVariant | undefined | null,
    allBoms: BillOfMaterial[],
    allPackItems?: any[],
  ) {
    const usedMaterials: { material: Material; quantity: number }[] = [];
    
    const productId = typeof product === 'object' && product !== null ? product.id : product;
    const variantId = typeof productVariant === 'object' && productVariant !== null ? productVariant.id : productVariant;

    let packItems = (allPackItems && allPackItems.length > 0 && (
      'parentProduct' in allPackItems[0] ||
      'parentVariant' in allPackItems[0] ||
      (allPackItems[0] && ('product' in allPackItems[0] || 'variant' in allPackItems[0]))
    ))
      ? allPackItems.filter((item) => {
          const itemParentProductId = item.parentProduct && typeof item.parentProduct === 'object' ? item.parentProduct.id : item.parentProduct;
          const itemParentVariantId = item.parentVariant && typeof item.parentVariant === 'object' ? item.parentVariant.id : item.parentVariant;

          if (itemParentProductId || itemParentVariantId) {
            const matchParentVariant = itemParentVariantId && variantId && String(itemParentVariantId) === String(variantId);
            const matchParentProduct = itemParentProductId && productId && String(itemParentProductId) === String(productId);
            return (variantId && matchParentVariant) ||
                   (!variantId && matchParentProduct);
          }
          return false;
        })
      : [];

    if (packItems.length === 0) {
      packItems = productVariant ? (productVariant.packItems ?? []) : (product.packItems ?? []);
    }

    const isPack = (typeof product === 'object' && product !== null && product.type === ProductType.Pack) || packItems.length > 0;

    const boms = isPack ? [] : allBoms.filter((bom) => {
      const bomProductId = bom.product && typeof bom.product === 'object' ? bom.product.id : bom.product;
      const bomVariantId = bom.variant && typeof bom.variant === 'object' ? bom.variant.id : bom.variant;
      
      const matchProduct = bomProductId && productId && String(bomProductId) === String(productId);
      const matchVariant = (!bomVariantId && !variantId) || 
                           (bomVariantId && variantId && String(bomVariantId) === String(variantId));
      return matchProduct && matchVariant;
    });

    for (const bom of boms) {
      const bomMaterialId = bom.material && typeof bom.material === 'object' ? bom.material.id : bom.material;
      const existingMaterial = usedMaterials.find((x) => {
        const existingMaterialId = x.material && typeof x.material === 'object' ? x.material.id : x.material;
        return String(existingMaterialId) === String(bomMaterialId);
      });
      if (existingMaterial) {
        existingMaterial.quantity += bom.quantity;
      } else {
        usedMaterials.push({ material: bom.material, quantity: bom.quantity });
      }
    }

    for (const item of packItems) {
      if (item.product) {
        try {
          const itemMaterials = Product.getAllMaterials(item.product, item.variant, allBoms, allPackItems);
          for (const material of itemMaterials) {
            const materialId = material.material && typeof material.material === 'object' ? material.material.id : material.material;
            const existingMaterial = usedMaterials.find((x) => {
              const existingMaterialId = x.material && typeof x.material === 'object' ? x.material.id : x.material;
              return String(existingMaterialId) === String(materialId);
            });
            if (existingMaterial) {
              existingMaterial.quantity += material.quantity * item.quantity;
            } else {
              usedMaterials.push({ material: material.material, quantity: material.quantity * item.quantity });
            }
          }
        } catch (error) {
          // Ignore
        }
      }
    }
    return usedMaterials;
  }
}

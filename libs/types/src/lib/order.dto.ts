import { Address } from './address';
import { DeliveryArea } from './delivery-area';
import { DiscountCoupon } from './discount-coupon';
import { Menu } from './menu';
import { Order, OrderDetails } from './order';
import { OrderItem } from './order-item';
import { OrderPaymentType } from './order-payment-type.enum';
import { OrderState } from './order-state.enum';
import { OrderType } from './order-type.enum';
import { Payment } from './payment';
import { Product } from './product';
import { ProductVariant } from './product-variant';

const FLOOR = 500;
export const MANUAL_DISCOUNT_TITLE = 'تخفیف دستی';
export const MANUAL_COST_TITLE = 'هزینه مازاد';
export const DISCOUNT_CODE_TITLE = 'کد تخفیف';
export const DELIVERY_COST_TITLE = 'هزینه ارسال';

export type ProductItem = {
  productId: string;
  productVariantId?: number;
  quantity: number;
};
export class OrderDto {
  id?: string;
  shopId: string;
  customerId?: string;
  creatorId?: string;
  waiterId?: string;
  state?: OrderState;
  type: OrderType;
  isManual?: boolean;
  packOrderId?: string;
  manualDiscount?: number;
  address?: Address;
  discountCoupon?: DiscountCoupon;
  payment?: Payment;
  manualCost?: number;
  paymentType?: OrderPaymentType;
  note?: string;
  details?: OrderDetails;
  productItems: ProductItem[];

  static productItems(dto: OrderDto, menu: Menu): OrderItem[] {
    if (dto.productItems) {
      const items = <OrderItem[]>dto.productItems
        .map((item) => {
          const product = Menu.getProductById(menu, item.productId);
          const productVariant = item.productVariantId
            ? Menu.getProductVariantById(menu, item.productVariantId)
            : undefined;
          if (product) return new OrderItem(product, item.quantity, productVariant || undefined);
          return null;
        })
        .filter((item) => item);
      return items;
    }
    return [];
  }

  static isStockValidForAddOne(
    product: Product,
    productVariant?: ProductVariant,
    item?: ProductItem,
    editOrder?: Order
  ) {
    if (!productVariant && product.stock == null) return true;
    if (productVariant && productVariant.stock == null) return true;

    let stock = (productVariant ? productVariant.stock : product.stock) || 0;
    const quantity = item?.quantity || 0;

    if (editOrder) {
      const editItem = Order.getItem(editOrder, product.id, productVariant?.id);
      if (editItem) stock += editItem.quantity;
    }

    return quantity < stock;
  }

  static sum(dto: OrderDto, menu: Menu) {
    let sum = 0;
    const items = OrderDto.productItems(dto, menu);
    for (const i of items) {
      sum += i.quantity * i.price;
    }
    return sum;
  }

  static abstractItems(dto: OrderDto, menu: Menu) {
    const costs = menu?.costs?.filter((x) => !x.showOnItem) || [];
    const abstractItems: OrderItem[] = [];
    const sum = OrderDto.sum(dto, menu);
    for (const c of costs) {
      let price = 0;
      if (c.fixedCost) price += c.fixedCost;
      if (c.percentageCost) {
        const dis = (sum * c.percentageCost) / 100;
        price += dis;
      }
      abstractItems.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.floor(price / FLOOR) * FLOOR,
        title: c.title,
      });
    }

    if (dto.discountCoupon) {
      let price = 0;
      if (dto.discountCoupon.fixedDiscount) price -= dto.discountCoupon.fixedDiscount;
      if (dto.discountCoupon.percentageDiscount) {
        let dis = (sum * dto.discountCoupon.percentageDiscount) / 100;
        if (dto.discountCoupon.maxDiscount && dis > dto.discountCoupon.maxDiscount)
          dis = dto.discountCoupon.maxDiscount;
        price -= dis;
      }
      abstractItems.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.floor(price / FLOOR) * FLOOR,
        title: DISCOUNT_CODE_TITLE,
      });
    }

    if (dto.address && dto.address.deliveryArea) {
      const area = dto.address.deliveryArea;
      if (!area.minPriceForFree || area.minPriceForFree > OrderDto.sum(dto, menu)) {
        abstractItems.push(<OrderItem>{
          isAbstract: true,
          quantity: 1,
          price: Math.floor(area.price / FLOOR) * FLOOR,
          title: DELIVERY_COST_TITLE,
        });
      }
    }

    if (dto.manualCost) {
      abstractItems.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: Math.floor(dto.manualCost / FLOOR) * FLOOR,
        title: MANUAL_COST_TITLE,
      });
    }

    if (dto.manualDiscount) {
      abstractItems.push(<OrderItem>{
        isAbstract: true,
        quantity: 1,
        price: -Math.floor(dto.manualDiscount / FLOOR) * FLOOR,
        title: MANUAL_DISCOUNT_TITLE,
      });
    }
    return abstractItems;
  }

  static total(dto: OrderDto, menu: Menu) {
    let total = OrderDto.sum(dto, menu);
    const abstractItems = OrderDto.abstractItems(dto, menu);
    for (const item of abstractItems) {
      total += item.quantity * item.price;
    }
    return Math.max(Math.floor(total / FLOOR) * FLOOR, 0);
  }
}

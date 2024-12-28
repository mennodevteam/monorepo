import { computed, inject, Injectable, signal } from '@angular/core';
import { Order, OrderDto, Product, ProductItem, ProductVariant } from '@menno/types';
import { MenuService } from '../../menu/menu.service';

@Injectable()
export class NewOrdersService {
  private readonly menu = inject(MenuService);
  private items = signal<ProductItem[]>([]);
  order = signal<Order | undefined>(undefined);
  dto = computed(
    () =>
      ({
        productItems: this.items(),
      }) as OrderDto,
  );

  productItems = computed(() => {
    const menu = this.menu.data();
    if (menu) {
      return OrderDto.productItems(this.dto(), menu);
    }
    return [];
  });

  add(product: Product, variant?: ProductVariant) {
    this.items.update((items) => {
      const exist = items.find((x) => x.productId === product.id && x.productVariantId === variant?.id);
      if (exist) exist.quantity++;
      else items.push({ productId: product.id, productVariantId: variant?.id, quantity: 1 });
      return [...items];
    });
  }

  menus(product: Product, variant?: ProductVariant) {
    this.items.update((items) => {
      const exist = items.find((x) => x.productId === product.id && x.productVariantId === variant?.id);
      if (exist) {
        exist.quantity--;
        if (exist.quantity <= 0) items.splice(items.indexOf(exist), 1);
        return [...items];
      }
      return items;
    });
  }
}

import { Component, input, computed, inject } from '@angular/core';
import { HomeSection, ProductListConfig, ProductListViewType, Product, Menu } from '@menno/types';
import { ProductCardComponent } from '../product-card/product-card.component';
import { MenuService } from '../../../core/services/menu.service';
import { CommonModule } from '@angular/common';
import { SectionComponent } from '../section/section.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SectionComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  readonly section = input.required<HomeSection>();
  private readonly menuService = inject(MenuService);

  readonly config = computed(() => this.section().config as ProductListConfig);
  readonly viewType = computed(() => this.config().viewType);
  readonly productIds = computed(() => this.config().productIds || []);
  readonly title = computed(() => this.config().title);

  readonly products = computed(() => {
    const ids = this.productIds();
    const menu = this.menuService.data();
    if (!menu || !ids.length) return [];

    const products: Product[] = [];
    for (const id of ids) {
      const product = Menu.getProductById(menu, id);
      if (product) {
        products.push(product);
      }
    }
    return products;
  });

  readonly isCarousel = computed(() => this.viewType() === ProductListViewType.Carousel);
  readonly isGrid = computed(() => this.viewType() === ProductListViewType.Grid);
}


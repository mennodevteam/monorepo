import { Component, input, computed, inject } from '@angular/core';
import { HomeSection, ProductListConfig, ProductListViewType, Product, Menu } from '@menno/types';
import { ProductCardComponent } from '../product-card/product-card.component';
import { MenuService } from '../../../core/services/menu.service';
import { LinkService } from '../../../core/services/link.service';
import { CommonModule } from '@angular/common';
import { SectionComponent } from '../section/section.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SectionComponent, MatGridListModule, RouterLink, ImageLoaderDirective],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  readonly section = input.required<HomeSection>();
  private readonly menuService = inject(MenuService);
  private readonly linkService = inject(LinkService);

  readonly config = computed(() => this.section().config as ProductListConfig);
  readonly viewType = computed(() => this.config().viewType);
  readonly productIds = computed(() => this.config().productIds || []);
  readonly title = computed(() => this.config().title);
  readonly gridCols = computed(() => this.config().gridCols || 3);
  readonly carouselRows = computed(() => this.config().carouselRows || 1);

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

  getProductImage(product: Product) {
    return Product.mainImageFile(product) ?? undefined;
  }

  getProductLink(product: Product): string {
    return this.linkService.getProductLink(product);
  }

  getRowIndices(): number[] {
    const rows = this.carouselRows();
    return Array.from({ length: rows }, (_, i) => i);
  }

  getProductsForRow(rowIndex: number): Product[] {
    const allProducts = this.products();
    const rows = this.carouselRows();
    const itemsPerRow = Math.ceil(allProducts.length / rows);
    const startIndex = rowIndex * itemsPerRow;
    return allProducts.slice(startIndex, startIndex + itemsPerRow);
  }
}


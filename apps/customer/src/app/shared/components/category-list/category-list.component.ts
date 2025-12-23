import { Component, input, computed, inject } from '@angular/core';
import { HomeSection, CategoryListConfig, CategoryListViewType, ProductCategory } from '@menno/types';
import { MenuService } from '../../../core/services/menu.service';
import { LinkService } from '../../../core/services/link.service';
import { CommonModule } from '@angular/common';
import { SectionComponent } from '../section/section.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, SectionComponent, MatGridListModule, RouterLink, ImageLoaderDirective],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent {
  readonly section = input.required<HomeSection>();
  private readonly menuService = inject(MenuService);
  private readonly linkService = inject(LinkService);

  readonly config = computed(() => this.section().config as CategoryListConfig);
  readonly viewType = computed(() => this.config().viewType);
  readonly categoryIds = computed(() => this.config().categoryIds || []);
  readonly title = computed(() => this.config().title);
  readonly gridCols = computed(() => this.config().gridCols || 3);
  readonly carouselRows = computed(() => this.config().carouselRows || 1);
  readonly showAll = computed(() => this.config().showAll || false);
  readonly seeMoreLabel = computed(() => (this.showAll() ? 'مشاهده همه' : ''));
  readonly seeMoreRouterLink = computed(() => (this.showAll() ? '/categories' : undefined));

  readonly categories = computed(() => {
    const ids = this.categoryIds();
    const menu = this.menuService.data();
    if (!menu || !ids.length) return [];

    const categories: ProductCategory[] = [];
    for (const id of ids) {
      const category = menu.categories?.find((c) => c.id === id);
      if (category) {
        categories.push(category);
      }
    }
    return categories;
  });

  readonly isCarousel = computed(() => this.viewType() === CategoryListViewType.Carousel);
  readonly isGrid = computed(() => this.viewType() === CategoryListViewType.Grid);
  readonly isButton = computed(() => this.viewType() === CategoryListViewType.Button);

  getCategoryImage(category: ProductCategory) {
    return category.imageFile ?? undefined;
  }

  getCategoryLink(category: ProductCategory): string {
    return this.linkService.getCategoryLink(category);
  }

  getRowIndices(): number[] {
    const rows = this.carouselRows();
    return Array.from({ length: rows }, (_, i) => i);
  }

  getCategoriesForRow(rowIndex: number): ProductCategory[] {
    const allCategories = this.categories();
    const rows = this.carouselRows();
    const itemsPerRow = Math.ceil(allCategories.length / rows);
    const startIndex = rowIndex * itemsPerRow;
    return allCategories.slice(startIndex, startIndex + itemsPerRow);
  }
}


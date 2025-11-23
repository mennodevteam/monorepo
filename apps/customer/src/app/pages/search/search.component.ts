import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { MenuService } from '../../core/services/menu.service';
import { Product } from '@menno/types';
import Fuse from 'fuse.js';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxArrowRight1Outline, saxSearchNormal1Outline } from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatInputModule,
    MatButtonModule,
    ProductCardComponent,
    NgIcon,
  ],
  providers: [
    provideIcons({
      saxArrowRight1Outline,
      saxSearchNormal1Outline,
    }),
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  private readonly menuService = inject(MenuService);
  private readonly location = inject(Location);

  readonly searchQuery = signal('');
  readonly menu = this.menuService.data;

  readonly allProducts = computed(() => {
    const menu = this.menu();
    if (!menu || !menu.categories) return [];

    let products: Product[] = [];
    for (const cat of menu.categories) {
      if (cat.products) {
        products.push(...cat.products);
      }
    }
    return products;
  });

  readonly fuse = computed(() => {
    const products = this.allProducts();
    return new Fuse(products, {
      keys: ['title', 'description'],
      threshold: 0.4,
    });
  });

  readonly filteredProducts = computed(() => {
    const query = this.searchQuery();
    const products = this.allProducts();

    if (!query) return [];

    return this.fuse()
      .search(query)
      .map((result) => result.item);
  });

  goBack() {
    this.location.back();
  }
}

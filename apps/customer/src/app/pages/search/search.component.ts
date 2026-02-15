import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { MenuService } from '../../core/services/menu.service';
import { Product } from '@menno/types';
import Fuse from 'fuse.js';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatInputModule,
    MatButtonModule,
    ProductCardComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  private static readonly QUERY_PARAM = 'q';
  private static readonly LAST_QUERY_STORAGE_KEY = 'customer.search.lastQuery';

  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly searchQuery = signal('');
  readonly menu = this.menuService.data;

  constructor() {
    const urlQuery = this.route.snapshot.queryParamMap.get(SearchComponent.QUERY_PARAM) ?? '';
    const storedQuery = sessionStorage.getItem(SearchComponent.LAST_QUERY_STORAGE_KEY) ?? '';
    const initialQuery = urlQuery || storedQuery;

    this.searchQuery.set(initialQuery);

    if (!urlQuery && storedQuery) {
      this.syncQueryToUrl(storedQuery);
    }
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    sessionStorage.setItem(SearchComponent.LAST_QUERY_STORAGE_KEY, query);
    this.syncQueryToUrl(query);
  }

  private syncQueryToUrl(query: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [SearchComponent.QUERY_PARAM]: query || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  readonly allProducts = computed(() => {
    const menu = this.menu();
    if (!menu || !menu.categories) return [];

    const products: Product[] = [];
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

    if (!query) return [];

    return this.fuse()
      .search(query)
      .map((result) => result.item);
  });
}

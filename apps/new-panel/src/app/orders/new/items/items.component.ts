import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { NewOrdersService } from '../new-order.service';
import { TranslateService } from '@ngx-translate/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MenuService } from '../../../menu/menu.service';
import { Product, ProductCategory, ProductVariant } from '@menno/types';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

const COLS = ['index', 'title', 'quantity', 'fee', 'total', 'actions'];

@Component({
  selector: 'app-new-order-items',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss',
})
export class NewOrderItemsComponent {
  readonly service = inject(NewOrdersService);
  readonly menu = inject(MenuService);
  readonly t = inject(TranslateService);
  Product = Product;
  displayedColumns = COLS;
  searchInput = signal('');
  searchedItems = computed(() => {
    const query = this.searchInput();
    const categories = this.menu.categories();
    const filtered: { category: ProductCategory; product: Product; variant?: ProductVariant }[] = [];

    if (categories && query) {
      for (const category of categories) {
        if (category.products) {
          for (const product of category.products) {
            if (category.title.search(query) > -1 || product.title.search(query) > -1) {
              if (product.variants?.length) {
                filtered.push(...product.variants.map((variant) => ({ category, product, variant })));
              } else {
                filtered.push({ category, product });
              }
            }
          }
        }
      }
    }
    return filtered;
  });
  items = computed(() => {
    if (this.service.productItems().length) {
      return [
        ...this.service.productItems(),
        ...this.service.abstractItems(),
        {
          title: this.t.instant('app.total'),
          isAbstract: true,
          quantity: 1,
          price: this.service.totalPrice(),
        },
      ];
    }
    return [];
  });

  selectItem(item: MatAutocompleteSelectedEvent) {
    const value = item.option.value;
    if (value) {
      this.service.add(value.product, value.variant);
      this.searchInput.set('');
      this.service.dirty.set(true);
    }
  }
}

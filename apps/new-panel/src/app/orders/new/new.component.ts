import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { NewOrdersService } from './new-order.service';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { NewOrderItemsComponent } from './items/items.component';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { MenuService } from '../../menu/menu.service';
import { Address, Member, OrderType, Product, ProductCategory, ProductVariant, User } from '@menno/types';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { SearchMemberAutocompleteComponent } from '../../shared/components/search-member-autocomplete/search-member-autocomplete.component';
import { ShopService } from '../../shop/shop.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    NewOrderItemsComponent,
    MatAutocompleteModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    SearchMemberAutocompleteComponent,
    MatButtonToggleModule,
    MatRadioModule,
  ],
  providers: [NewOrdersService],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss',
})
export class NewOrderComponent implements FormComponent {
  private readonly http = inject(HttpClient);
  readonly t = inject(TranslateService);
  readonly shop = inject(ShopService);
  readonly dialog = inject(DialogService);
  readonly service = inject(NewOrdersService);
  readonly location = inject(PlatformLocation);
  saving = signal(false);
  private menu = inject(MenuService);
  Product = Product;
  User = User;
  OrderType = OrderType;
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

  addressesQuery = injectQuery(() => ({
    queryKey: ['addresses', this.service.customer()?.id],
    queryFn: () => lastValueFrom(this.http.get<Address[]>(`/addresses/${this.service.customer()?.id}`)),
    enabled: !!this.service.customer(),
  }));

  selectItem(item: MatAutocompleteSelectedEvent) {
    const value = item.option.value;
    if (value) {
      this.service.add(value.product, value.variant);
      this.searchInput.set('');
    }
  }

  selectUser(member?: Member | null) {
    if (member) this.service.customer.set(member.user);
  }

  canDeactivate() {
    const itemCount = this.service.productItems()?.length || 0;
    return this.saving() || itemCount === 0;
  }

  setManualDiscount() {
    const title = this.t.instant('newOrder.manualDiscount');
    this.dialog
      .prompt(title, {
        value: {
          label: title,
          control: new FormControl(this.service.manualDiscount() || undefined, Validators.required),
          hint: this.t.instant('app.currency'),
          type: 'number',
        },
      })
      .then((dto) => {
        if (dto) {
          this.service.manualDiscount.set(dto.value || 0);
        }
      });
  }

  setManualCost() {
    const title = this.t.instant('newOrder.manualCost');
    this.dialog
      .prompt(title, {
        value: {
          label: title,
          control: new FormControl(this.service.manualCost() || undefined, Validators.required),
          hint: this.t.instant('app.currency'),
          type: 'number',
        },
      })
      .then((dto) => {
        if (dto) {
          this.service.manualCost.set(dto.value || 0);
        }
      });
  }

  async save() {
    try {
      this.saving.set(true);
      await this.service.save();
      this.location.back();
    } finally {
      this.saving.set(false);
    }
  }
}

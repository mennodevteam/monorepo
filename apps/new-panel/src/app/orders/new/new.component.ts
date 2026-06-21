import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { NewOrdersService } from './new-order.service';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { NewOrderItemsComponent } from './items/items.component';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { Order, OrderType, Product, ProductCategory, ProductVariant, Status } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { AddressListComponent } from './address-list/address-list.component';
import { CustomerComponent } from './customer/customer.component';
import { OrderTypeComponent } from './order-type/order-type.component';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfigModalComponent, OrderConfigData } from './config-modal/config-modal.component';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MenuService } from '../../menu/menu.service';
import Fuse from 'fuse.js';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTooltipModule,
    NewOrderItemsComponent,
    AddressListComponent,
    CustomerComponent,
    OrderTypeComponent,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  providers: [NewOrdersService],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss',
})
export class NewOrderComponent implements FormComponent {
  readonly t = inject(TranslateService);
  readonly shop = inject(ShopService);
  readonly menu = inject(MenuService);
  readonly http = inject(HttpClient);
  readonly dialog = inject(DialogService);
  readonly matDialog = inject(MatDialog);
  readonly service = inject(NewOrdersService);
  readonly location = inject(PlatformLocation);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  saving = signal(false);
  OrderType = OrderType;
  Product = Product;
  searchInput = signal('');

  allSearchableItems = computed(() => {
    const categories = this.menu.categories() || [];
    const list: {
      category: ProductCategory;
      product: Product;
      variant?: ProductVariant;
      productTitle: string;
      variantTitle: string;
      categoryTitle: string;
      combinedTitle: string;
    }[] = [];
    for (const category of categories) {
      if (category.products) {
        for (const product of category.products) {
          if (product.variants?.length) {
            for (const variant of product.variants) {
              list.push({
                category,
                product,
                variant,
                productTitle: product.title,
                variantTitle: variant.title,
                categoryTitle: category.title,
                combinedTitle: `${product.title} ${variant.title}`,
              });
            }
          } else {
            list.push({
              category,
              product,
              productTitle: product.title,
              variantTitle: '',
              categoryTitle: category.title,
              combinedTitle: product.title,
            });
          }
        }
      }
    }
    return list;
  });

  fuse = computed(() => {
    const list = this.allSearchableItems();
    return new Fuse(list, {
      keys: [
        { name: 'combinedTitle', weight: 1 },
        { name: 'productTitle', weight: 0.8 },
        { name: 'variantTitle', weight: 0.6 },
        { name: 'categoryTitle', weight: 0.3 }
      ],
      threshold: 0.4,
    });
  });

  searchedItems = computed(() => {
    const query = this.searchInput().trim();
    if (!query) return [];
    return this.fuse().search(query).map(res => res.item);
  });

  selectItem(item: MatAutocompleteSelectedEvent) {
    const value = item.option.value;
    if (value) {
      this.service.add(value.product, value.variant);
      this.searchInput.set('');
      this.service.dirty.set(true);
    }
  }

  getItemStatus(product: Product, variant?: ProductVariant): { label: string; class: string; disabled: boolean } {
    const pStatus = product.status;
    const vStatus = variant?.status;

    if (pStatus === Status.Inactive || vStatus === Status.Inactive) {
      return { label: 'غیرفعال', class: 'status-badge-inactive', disabled: true };
    }

    if (
      pStatus === Status.Blocked ||
      vStatus === Status.Blocked ||
      product.stock === 0 ||
      variant?.stock === 0
    ) {
      return { label: 'ناموجود', class: 'status-badge-unavailable', disabled: false };
    }

    return { label: 'موجود', class: 'status-badge-available', disabled: false };
  }

  orderId = signal(this.route.snapshot.params['id']);
  orderQuery = injectQuery(() => ({
    queryKey: ['orderDetails', this.orderId()],
    queryFn: () => lastValueFrom(this.http.get<Order>(`/orders/panel/${this.orderId()}`)),
    enabled: !!this.orderId(),
  }));
  order = computed<Order | undefined>(() => {
    return this.orderQuery.data() || this.router.currentNavigation()?.extras?.state?.['order'];
  });

  constructor() {
    effect(() => {
      this.route.paramMap.subscribe((params) => {
        this.orderId.set(params.get('id'));
      });
    });

    effect(() => {
      const order = this.order();
      if (order) {
        this.service.order.set(order);
      }
    });

    if (!this.route.snapshot.params['id']) {
      this.service.loadLastActiveSlot();
    }
  }

  canDeactivate() {
    if (!this.orderId()) {
      return true; // No warning needed since slot memory auto-saves progress
    }
    return !this.service.dirty();
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
          this.service.dirty.set(true);
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
          this.service.dirty.set(true);
        }
      });
  }

  openConfigModal() {
    const configData: OrderConfigData = {
      orderDateTime: this.service.orderDateTime(),
      useCurrentDateTime: this.service.useCurrentDateTime(),
      excludeFromReport: this.service.excludeFromReport(),
      extraCost: this.service.extraCost(),
      referrer: this.service.orderReferrer(),
      campaign: this.service.orderCampaign(),
    };

    const dialogRef = this.matDialog.open(ConfigModalComponent, {
      data: configData,
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: OrderConfigData) => {
      if (result) {
        this.service.updateConfig(result);
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

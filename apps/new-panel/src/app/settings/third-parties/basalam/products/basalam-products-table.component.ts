import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../../../menu/menu.service';
import { Menu } from '@menno/types';
import { FormBuilder } from '@angular/forms';
import { ShopService } from '../../../../shop/shop.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-basalam-products-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './basalam-products-table.component.html',
  styleUrl: './basalam-products-table.component.scss',
})
export class BasalamProductsTableComponent {
  private readonly menu = inject(MenuService);
  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  private readonly fb = inject(FormBuilder);

  query = injectQuery(() => ({
    queryKey: ['basalamProducts'],
    queryFn: () => lastValueFrom(this.http.get(`basalam/products/list`)),
    // enabled: !!this.shopService.data(),
  }));

  allProducts = computed(() => {
    const menu = this.menu.data();
    const products = menu ? Menu.getProductList(menu) : [];
    return products.map((p) => {
      return this.fb.group({});
    });
  });
}

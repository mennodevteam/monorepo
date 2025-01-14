import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ShopService } from '../../../shop/shop.service';
import { ThirdPartyApp } from '@menno/types';
import { BasalamProductsTableComponent } from "./products/basalam-products-table.component";

@Component({
  selector: 'app-basalam',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule, MatToolbarModule, BasalamProductsTableComponent],
  templateUrl: './basalam.component.html',
  styleUrl: './basalam.component.scss',
})
export class BasalamComponent {
  readonly shop = inject(ShopService);
  thirdParty = computed(() => this.shop.data()?.thirdParties?.find((t) => t.app === ThirdPartyApp.Basalam));
}

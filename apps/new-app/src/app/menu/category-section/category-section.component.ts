import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuViewType, ProductCategory } from '@menno/types';
import { COMMON } from '../../common';
import { ProductListViewComponent } from "../product-list/product-list-view/product-list-view.component";
import { ProductGridViewComponent } from "../product-list/product-grid-view/product-grid-view.component";
import { ProductCardViewComponent } from "../product-list/product-card-view/product-card-view.component";
import { ShopService } from '../../core';

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, COMMON, ProductListViewComponent, ProductGridViewComponent, ProductCardViewComponent],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss',
})
export class CategorySectionComponent {
  MenuViewType = MenuViewType;
  @Input() category: ProductCategory;
  constructor(private shopService: ShopService){}

  get viewType() {
    return this.shopService.shop.appConfig?.menuViewType || MenuViewType.Grid;
  }
}

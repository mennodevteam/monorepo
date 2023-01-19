import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { orderingRoutes } from './ordering.routes';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';
import { MenuCategoriesComponent } from './menu-page/menu-categories/menu-categories.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { SharedModule } from '../../shared/shared.module';
import { CategoryGridViewComponent } from './menu-page/category-grid-view/category-grid-view.component';
import { CategoryCardViewComponent } from './menu-page/category-card-view/category-card-view.component';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DiscountBadgeComponent } from './discount-badge/discount-badge.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    ShopHomeComponent,
    MenuCategoriesComponent,
    ProductPageComponent,
    CategoryGridViewComponent,
    CategoryCardViewComponent,
    DiscountBadgeComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(orderingRoutes),
    SharedModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatCardModule,
    MatBadgeModule,
    MatGridListModule,
    MatRippleModule,
  ],
})
export class OrderingModule {}

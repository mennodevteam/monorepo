import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { orderingRoutes } from './ordering.routes';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { MenuToolbarComponent } from './menu-page/menu-toolbar/menu-toolbar.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';
import { MenuCategoriesComponent } from './menu-page/menu-categories/menu-categories.component';
import { ProductCardComponent } from './menu-page/product-card/product-card.component';
import { ProductPageComponent } from './product-page/product-page.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    MenuToolbarComponent,
    ShopHomeComponent,
    MenuCategoriesComponent,
    ProductCardComponent,
    ProductPageComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(orderingRoutes),
    MatButtonModule,
    MatListModule,
    MatToolbarModule,
    MatChipsModule,
    MatCardModule,
  ],
})
export class OrderingModule {}

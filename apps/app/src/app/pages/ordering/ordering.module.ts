import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { orderingRoutes } from './ordering.routes';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { BasketPageComponent } from './basket-page/basket-page.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectOrderTypeModalComponent } from './select-order-type-modal/select-order-type-modal.component';
import { DisableOrderingCardComponent } from './disable-ordering-card/disable-ordering-card.component';
import { LocationsBottomSheetComponent } from './locations-bottom-sheet/locations-bottom-sheet.component';
import { LocationEditBottomSheetComponent } from './location-edit-bottom-sheet/location-edit-bottom-sheet.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { ShopTablesBottomSheetComponent } from './shop-tables-bottom-sheet/shop-tables-bottom-sheet.component';
import { CategoryCompactViewComponent } from './menu-page/category-compact-view/category-compact-view.component';
import { OrderCompleteComponent } from './order-complete/order-complete.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { DiscountCouponListPageComponent } from './discount-coupon-list-page/discount-coupon-list-page.component';
import { DingBottomSheetComponent } from './ding-bottom-sheet/ding-bottom-sheet.component';
import { ShopGroupPageComponent } from './shop-group-page/shop-group-page.component';
import { ShopWelcomeComponent } from './shop-welcome/shop-welcome.component';
import { ShopInfoModalComponent } from './shop-info-modal/shop-info-modal.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    ShopHomeComponent,
    MenuCategoriesComponent,
    ProductPageComponent,
    CategoryGridViewComponent,
    CategoryCardViewComponent,
    DiscountBadgeComponent,
    LocationsBottomSheetComponent,
    ShopTablesBottomSheetComponent,
    LocationEditBottomSheetComponent,
    BasketPageComponent,
    SelectOrderTypeModalComponent,
    DisableOrderingCardComponent,
    CategoryCompactViewComponent,
    OrderCompleteComponent,
    DiscountCouponListPageComponent,
    DingBottomSheetComponent,
    ShopGroupPageComponent,
    ShopWelcomeComponent,
    ShopInfoModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(orderingRoutes),
    MatFormFieldModule,
    MatInputModule,
    SharedModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatChipsModule,
    MatCardModule,
    MatBadgeModule,
    MatGridListModule,
    MatRippleModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    LeafletModule,
  ],
})
export class OrderingModule {}

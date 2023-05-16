import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { menuRoutes } from './menu.routes';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { SharedModule } from '../../shared/shared.module';
import { MenuCategoryContainerComponent } from './menu-page/menu-category-container/menu-category-container.component';
import { ProductsTableComponent } from './menu-page/products-table/products-table.component';
import { ProductEditPageComponent } from './product-edit-page/product-edit-page.component';
import { MenuComponent } from './menu.component';
import { DiscountsPageComponent } from './discounts-page/discounts-page.component';
import { EditDiscountComponent } from './discounts-page/edit-discount/edit-discount.component';
import { CostsPageComponent } from './costs-page/costs-page.component';
import { EditCostComponent } from './costs-page/edit-cost/edit-cost.component';
import { SelectProductCardComponent } from './select-product-card/select-product-card.component';
import { CategoryEditPageComponent } from './category-edit-page/category-edit-page.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    MenuCategoryContainerComponent,
    ProductsTableComponent,
    ProductEditPageComponent,
    MenuComponent,
    DiscountsPageComponent,
    EditDiscountComponent,
    CostsPageComponent,
    EditCostComponent,
    SelectProductCardComponent,
    CategoryEditPageComponent,
  ],
  imports: [CommonModule, RouterModule.forChild(menuRoutes), SharedModule],
})
export class MenuModule {}

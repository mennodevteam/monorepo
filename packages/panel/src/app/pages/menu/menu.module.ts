import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { menuRoutes } from './menu.routes';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { SharedModule } from '../../shared/shared.module';
import { MenuCategoryContainerComponent } from './menu-page/menu-category-container/menu-category-container.component';
import { ProductsTableComponent } from './menu-page/products-table/products-table.component';
import { CategoryEditDialogComponent } from './menu-page/category-edit-dialog/category-edit-dialog.component';
import { ProductEditPageComponent } from './product-edit-page/product-edit-page.component';
import { MenuComponent } from './menu.component';
import { DiscountsPageComponent } from './discounts-page/discounts-page.component';
import { EditDiscountComponent } from './discounts-page/edit-discount/edit-discount.component';

@NgModule({
  declarations: [
    MenuPageComponent,
    MenuCategoryContainerComponent,
    ProductsTableComponent,
    CategoryEditDialogComponent,
    ProductEditPageComponent,
    MenuComponent,
    DiscountsPageComponent,
    EditDiscountComponent,
  ],
  imports: [CommonModule, RouterModule.forChild(menuRoutes), SharedModule],
})
export class MenuModule {}

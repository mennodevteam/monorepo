import { Route } from '@angular/router';
import { CostsPageComponent } from './costs-page/costs-page.component';
import { EditCostComponent } from './costs-page/edit-cost/edit-cost.component';
import { DiscountsPageComponent } from './discounts-page/discounts-page.component';
import { EditDiscountComponent } from './discounts-page/edit-discount/edit-discount.component';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { MenuComponent } from './menu.component';
import { ProductEditPageComponent } from './product-edit-page/product-edit-page.component';

export const menuRoutes: Route[] = [
  {
    path: '',
    component: MenuComponent,
    children: [
      { path: 'items', component: MenuPageComponent },
      { path: 'items/product', component: ProductEditPageComponent },
      { path: 'discounts', component: DiscountsPageComponent },
      { path: 'discounts/edit', component: EditDiscountComponent },
      { path: 'costs', component: CostsPageComponent },
      { path: 'costs/edit', component: EditCostComponent },
      { path: '', redirectTo: 'items', pathMatch: 'full' },
    ],
  },
];

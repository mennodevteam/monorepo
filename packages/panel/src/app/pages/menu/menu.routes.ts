import { Route } from '@angular/router';
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
      { path: '', redirectTo: 'items', pathMatch: 'full' },
    ],
  },
];

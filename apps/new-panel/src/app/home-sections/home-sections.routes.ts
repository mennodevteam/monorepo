import { Route } from '@angular/router';
import { HomeSectionsComponent } from './home-sections.component';
import { BannerEditComponent } from './banner-edit/banner-edit.component';
import { ProductListEditComponent } from './product-list-edit/product-list-edit.component';
import { CategoryListEditComponent } from './category-list-edit/category-list-edit.component';

export const homeSectionsRoutes: Route[] = [
  { path: '', component: HomeSectionsComponent },
  { path: 'banner', component: BannerEditComponent },
  { path: 'banner/:id', component: BannerEditComponent },
  { path: 'product-list', component: ProductListEditComponent },
  { path: 'product-list/:id', component: ProductListEditComponent },
  { path: 'category-list', component: CategoryListEditComponent },
  { path: 'category-list/:id', component: CategoryListEditComponent },
];


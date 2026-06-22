import { Route } from '@angular/router';
import { MaterialsListComponent } from './materials/materials-list.component';
import { BomListComponent } from './bom-list/bom-list.component';
import { PurchaseInvoicesComponent } from './purchase-invoices/purchase-invoices.component';
import { StocktakingComponent } from './stocktaking/stocktaking.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';

export const materialsRoutes: Route[] = [
  {
    path: 'materials',
    component: MaterialsListComponent,
  },
  {
    path: 'bom',
    component: BomListComponent,
  },
  {
    path: 'materials/purchase-invoices',
    component: PurchaseInvoicesComponent,
    canDeactivate: [dirtyFormDeactivator],
  },
  {
    path: 'materials/purchase-invoices/:id',
    component: PurchaseInvoicesComponent,
    canDeactivate: [dirtyFormDeactivator],
  },
  {
    path: 'materials/stocktaking',
    component: StocktakingComponent,
    canDeactivate: [dirtyFormDeactivator],
  },
  {
    path: 'materials/stocktaking/:id',
    component: StocktakingComponent,
    canDeactivate: [dirtyFormDeactivator],
  },
];
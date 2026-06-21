import { Route } from '@angular/router';
import { MaterialsListComponent } from './materials/materials-list.component';
import { BomListComponent } from './bom-list/bom-list.component';
import { PurchaseInvoicesComponent } from './purchase-invoices/purchase-invoices.component';

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
    path: 'purchase-invoices',
    component: PurchaseInvoicesComponent,
  },
];
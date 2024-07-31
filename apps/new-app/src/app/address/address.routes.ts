import { Route } from '@angular/router';
import { MapComponent } from './map/map.component';
import { SearchComponent } from './search/search.component';
import { AddressEditComponent } from './address-edit/address-edit.component';
import { AddressListComponent } from './address-list/address-list.component';

export const addressRoutes: Route[] = [
  { path: 'map', component: MapComponent },
  { path: 'search', component: SearchComponent },
  { path: 'list', component: AddressListComponent },
  { path: 'edit', component: AddressEditComponent },
];

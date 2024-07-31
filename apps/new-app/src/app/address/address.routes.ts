import { Route } from '@angular/router';
import { MapComponent } from './map/map.component';
import { SearchComponent } from './search/search.component';
import { AddressEditComponent } from './address-edit/address-edit.component';
import { AddressListComponent } from './address-list/address-list.component';

export const addressRoutes: Route[] = [
  { path: 'map', component: MapComponent, data: {animation: 'map'} },
  { path: 'search', component: SearchComponent, data: {animation: 'map-search'} },
  { path: 'list', component: AddressListComponent, data: {animation: 'address-list'} },
  { path: 'edit', component: AddressEditComponent, data: {animation: 'address-edit'} },
];

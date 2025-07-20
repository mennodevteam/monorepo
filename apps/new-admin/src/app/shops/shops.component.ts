import { Component, inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShopsTableComponent } from './shops-table/shops-table.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Shop } from '@menno/types';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ShopsTableComponent
],
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.scss']
})
export class ShopsComponent {
  http = inject(HttpClient)
  // TanStack Query for fetching shops
  shopsQuery = injectQuery(() => ({
    queryKey: ['shops'],
    queryFn: () => this.http.get<Shop[]>('/shops').toPromise(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }));


} 
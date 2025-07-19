import { Component, ViewChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Shop, ShopUserRole, Status } from '@menno/types';

@Component({
  selector: 'app-shops-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './shops-table.component.html',
  styleUrls: ['./shops-table.component.scss'],
})
export class ShopsTableComponent {
  displayedColumns: string[] = [
    'id',
    'title',
    'username',
    'address',
    'phones',
    'status',
    'createdAt',
    'actions',
  ];
  data = input<Shop[]>([]);

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'INACTIVE':
        return 'warn';
      case 'PENDING':
        return 'accent';
      default:
        return 'primary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'PENDING':
        return 'Pending';
      default:
        return status;
    }
  }

  getPhoneNumber(shop: Shop): string {
    return shop.users.find((user) => user.role === ShopUserRole.Admin)?.user?.mobilePhone ?? '';
  }

  editShop(shop: Shop) {
    console.log('Edit shop:', shop);
    // Implement edit functionality
  }

  viewShop(shop: Shop) {
    console.log('View shop:', shop);
    // Implement view functionality
  }

  toggleShopStatus(shop: Shop) {
    console.log('Toggle status for shop:', shop);
    // Implement status toggle functionality
  }

  deleteShop(shop: Shop) {
    console.log('Delete shop:', shop);
    // Implement delete functionality
  }
}

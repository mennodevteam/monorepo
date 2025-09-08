import { Component, computed, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { OrderTotalComponent } from './order-total/order-total.component';
import { TopProductsCardComponent } from './top-products-card/top-products-card.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-orders-dashboard',
  standalone: true,
  imports: [
    SHARED, 
    OrderTotalComponent, 
    TopProductsCardComponent, 
    OrderDetailsComponent,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
  ],
  templateUrl: './orders-dashboard.component.html',
  styleUrl: './orders-dashboard.component.scss',
})
export class OrdersDashboardComponent {
  fromDate = signal<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  toDate = signal<Date>(new Date());

  validFromDate = computed(() => {
    const date = new Date((this.fromDate() as any)._d || this.fromDate());
    date.setHours(0, 0, 0, 0);
    return date;
  });

  validToDate = computed(() => {
    const date = new Date((this.toDate() as any)._d || this.toDate());
    date.setHours(23, 59, 59, 999);
    return date;
  });
}

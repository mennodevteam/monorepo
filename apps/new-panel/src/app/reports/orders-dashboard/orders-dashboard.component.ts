import { Component, computed, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { TopProductsCardComponent } from './top-products-card/top-products-card.component';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrdersPerDayChartComponent } from './orders-per-day-chart/orders-per-day-chart.component';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import * as moment from 'jalali-moment';

@Component({
  selector: 'app-orders-dashboard',
  standalone: true,
  imports: [
    SHARED, 
    TopProductsCardComponent, 
    OrderDetailsComponent,
    OrdersPerDayChartComponent,
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
  fromDate = signal<Date>(this.getStartOfJalaliMonth());
  toDate = signal<Date>(new Date());

  validFromDate = computed(() => {
    const date = new Date((this.fromDate() as any)?._d || this.fromDate());
    date.setHours(0, 0, 0, 0);
    return date;
  });

  validToDate = computed(() => {
    const date = new Date((this.toDate() as any)?._d || this.toDate());
    date.setHours(23, 59, 59, 999);
    return date;
  });

  private getStartOfJalaliMonth(): Date {
    // Use jalali-moment to get the start of current Jalali month
    const startOfJalaliMonth = moment().startOf('jMonth');
    return startOfJalaliMonth.toDate();
  }
}
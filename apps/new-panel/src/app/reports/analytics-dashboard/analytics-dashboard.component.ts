import { Component, computed, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { MenuStatCardComponent } from './menu-stat-card/menu-stat-card.component';
import { LoadMenuRefCardComponent } from './load-menu-ref-card/load-menu-ref-card.component';
import { UserStatCardComponent } from './user-stat-card/user-stat-card.component';
import { OrderFunnelCardComponent } from './order-funnel-card/order-funnel-card.component';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    SHARED,
    MenuStatCardComponent,
    LoadMenuRefCardComponent,
    UserStatCardComponent,
    OrderFunnelCardComponent,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent {
  fromDate = signal<Date>(new Date(new Date().setDate(new Date().getDate() - 3)));
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
}

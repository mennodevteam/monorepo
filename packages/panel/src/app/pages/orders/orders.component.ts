import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { DailyOrderFilter, DailyOrderListService } from './daily-order-list.service';

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent {
  dateControl = new FormControl(this.OS.date);
  filterControl = new FormControl<DailyOrderFilter>(this.OS.filter);
  today = new Date();
  constructor(private OS: DailyOrderListService, private router: Router, private route: ActivatedRoute) {
    this.dateControl.valueChanges.subscribe((value: any) => {
      if (value) {
        this.OS.date = value._d || value || new Date();
        this.setQueryParams();
      }
    });
    this.filterControl.valueChanges.subscribe((value) => {
      if (value) {
        this.OS.filter = value;
        this.setQueryParams();
      }
    });
  }

  get filter() {
    return this.OS.filter;
  }

  set filter(value: DailyOrderFilter) {
    this.OS.filter = value;
  }

  get orders() {
    return this.OS.orders;
  }

  get date() {
    return this.OS.date;
  }

  get loading() {
    return this.OS.loading;
  }

  setQueryParams() {
    const qp = JSON.parse(JSON.stringify(this.route.snapshot.queryParams || {}));
    qp.date = `${this.date.getFullYear()}-${this.date.getMonth() + 1}-${this.date.getDate()}`;
    this.router.navigate([], {
      queryParams: qp,
      replaceUrl: true,
    });
  }

  goToPrevDate() {
    const date = new Date(this.date);
    date.setDate(date.getDate() - 1);
    this.dateControl.setValue(date);
  }

  goToNextDate() {
    const date = new Date(this.date);
    date.setDate(date.getDate() + 1);
    this.dateControl.setValue(date);
  }

  goToToday() {
    const date = new Date(this.today);
    this.dateControl.setValue(date);
  }
}

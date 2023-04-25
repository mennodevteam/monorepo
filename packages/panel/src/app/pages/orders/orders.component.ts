import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { OrdersService } from '../../core/services/orders.service';
import { DailyOrderFilter, DailyOrderListService, DailyOrderStateFilter } from './daily-order-list.service';
import { ShopService } from '../../core/services/shop.service';

const LOCAL_STORAGE_TABLE_KEY = 'ui.dailyOrderTable';
@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent {
  dateControl = new FormControl(this.OS.date);
  filterGroup = new FormGroup({
    state: new FormControl(this.OS.filter.state, Validators.required),
    type: new FormControl(this.OS.filter.type),
    table: new FormControl(this.OS.filter.table),
  });

  constructor(
    public OS: DailyOrderListService,
    private router: Router,
    private route: ActivatedRoute,
    private shopService: ShopService
  ) {
    const localStorageTable = localStorage.getItem(LOCAL_STORAGE_TABLE_KEY);
    if (localStorageTable) {
      this.tableFilter = localStorageTable;
    }

    this.dateControl.valueChanges.subscribe((value: any) => {
      if (value) {
        this.OS.date = value._d || value || new Date();
        this.setQueryParams();
      }
    });
    this.filterGroup.valueChanges.subscribe((value) => {
      if (value) {
        if (value.state != undefined) this.OS.filter.state = value.state;
        if (value.type !== undefined) this.OS.filter.type = value.type || undefined;
        if (value.table !== undefined) this.OS.filter.table = value.table || undefined;
        this.setQueryParams();
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.dateControl.setValue(params['date'] ? new Date(params['date']) : this.OS.today);
      const paramFilter = params['filter'];
      if (paramFilter) this.filterGroup.controls['state'].setValue(paramFilter);
    });
  }

  get stateFilter() {
    return this.OS.filter.state;
  }

  set stateFilter(value: DailyOrderStateFilter) {
    this.filterGroup.controls['state'].setValue(value);
  }

  get tableFilter() {
    return this.OS.filter.table;
  }

  set tableFilter(value: string | undefined) {
    if (value) localStorage.setItem(LOCAL_STORAGE_TABLE_KEY, value);
    else localStorage.removeItem(LOCAL_STORAGE_TABLE_KEY);
    this.filterGroup.controls['table'].setValue(value || null);
  }

  get orders() {
    return this.OS.orders;
  }

  get date() {
    return this.OS.date;
  }

  get tables() {
    return this.shopService.shop?.details.tables || [];
  }

  get loading() {
    return this.OS.loading;
  }

  setQueryParams() {
    const qp = JSON.parse(JSON.stringify(this.route.snapshot.queryParams || {}));
    qp.date = `${this.date.getFullYear()}-${this.date.getMonth() + 1}-${this.date.getDate()}`;
    qp.filter = this.stateFilter;
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
    const date = new Date(this.OS.today);
    this.dateControl.setValue(date);
  }

  orderClicked(order: Order) {
    this.router.navigateByUrl(`/orders/details/${order.id}`);
  }

  toggleTableFilter() {
    if (this.tableFilter) this.tableFilter = undefined;
    else this.tableFilter = this.tables[0].code;
  }
}

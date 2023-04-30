import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '@menno/types';
import { DailyOrderListService, DailyOrderStateFilter } from './daily-order-list.service';
import { ShopService } from '../../core/services/shop.service';

@Component({
  selector: 'orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent {
  dateControl = new FormControl(this.OS.date);

  constructor(
    public OS: DailyOrderListService,
    private router: Router,
    private route: ActivatedRoute,
    private shopService: ShopService
  ) {
    this.dateControl.valueChanges.subscribe((value: any) => {
      if (value) {
        this.OS.setFilter({ date: value._d || value || new Date() });
        this.setQueryParams();
      }
    });

    this.route.queryParams.subscribe((params) => {
      this.dateControl.setValue(params['date'] ? new Date(params['date']) : this.OS.today);
    });
  }

  get stateFilter() {
    return this.OS.filter.state;
  }

  set stateFilter(value: DailyOrderStateFilter) {
    this.OS.setFilter({ state: value });
  }

  get tableFilter() {
    return this.OS.filter.table;
  }

  set tableFilter(value: string | undefined) {
    this.OS.setFilter({ table: value });
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

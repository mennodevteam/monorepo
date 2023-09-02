import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { filter, map, Observable, take } from 'rxjs';
import { TodayOrdersService } from '../services/today-orders.service';

@Injectable({
  providedIn: 'root',
})
export class TodayOrdersGuard implements CanActivate {
  constructor(private todayOrders: TodayOrdersService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.todayOrders.orders) return true;
    return this.todayOrders.ordersObservable
      .pipe(
        filter((x) => x !== null),
        map((x) => (x ? true : false))
      )
      .pipe(take(1));
  }
}

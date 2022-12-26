import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { concat, filter, map, merge, Observable } from 'rxjs';
import { MenuService } from '../services/menu.service';
import { ShopService } from '../services/shop.service';

@Injectable({
  providedIn: 'root',
})
export class ShopGuard implements CanActivate {
  constructor(private shopService: ShopService, private menuService: MenuService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const shop = this.shopService.shopObservable.pipe(
      filter((x) => x !== null),
      map((x) => (x ? true : false))
    );
    const menu = this.menuService.menuObservable.pipe(
      filter((x) => x !== null),
      map((x) => (x ? true : false))
    );
    return concat(shop, menu);
  }
}

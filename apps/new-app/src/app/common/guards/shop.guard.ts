import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { ShopService } from '../services/shop.service';

@Injectable({
  providedIn: 'root',
})
export class ShopGuard implements CanActivate {
  constructor(private shopService: ShopService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.shopService.shopObservable.pipe(filter(x => x != null), map((x) => (x ? true : false)));
  }
}

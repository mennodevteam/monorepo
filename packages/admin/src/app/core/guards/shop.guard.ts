import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { ShopsService } from '../services/shops.service';

@Injectable({
  providedIn: 'root',
})
export class ShopGuard implements CanActivate {
  constructor(private shopsService: ShopsService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.shopsService.shopsObservable.pipe(
      filter((x) => x !== null),
      map((x) => (x ? true : false))
    );
  }
}

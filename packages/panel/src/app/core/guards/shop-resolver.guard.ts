import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { ShopService } from '../services/shop.service';

@Injectable({
  providedIn: 'root'
})
export class ShopResolverGuard implements CanActivate {
  constructor(
    private shopService: ShopService,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.shopService.shop.pipe(filter(x => x != undefined)).pipe(take(1)).pipe(map(x => true));
  }

}

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { filter, map, Observable } from 'rxjs';
import { MenuService } from '../services/menu.service';

@Injectable({
  providedIn: 'root',
})
export class MenuGuard implements CanActivate {
  constructor(private menuService: MenuService) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.menuService.menuObservable.pipe(filter(x => x !== null), map((x) => (x ? true : false)));
  }
}

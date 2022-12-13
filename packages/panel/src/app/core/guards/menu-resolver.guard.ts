import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { MenuService } from '../services/menu.service';

@Injectable({
  providedIn: 'root'
})
export class MenuResolverGuard implements CanActivate {
  constructor(
    private menuService: MenuService,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.menuService.menu.pipe(filter(x => x != undefined)).pipe(take(1)).pipe(map(x => true));
  }
}

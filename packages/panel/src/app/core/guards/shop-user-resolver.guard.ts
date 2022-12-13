import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { UserActionsService } from '../services/user-actions.service';

@Injectable({
  providedIn: 'root'
})
export class ShopUserResolverGuard implements CanActivate {
  constructor(
    private userActionsService: UserActionsService,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.userActionsService.actions.pipe(filter(x => x != undefined)).pipe(take(1)).pipe(map(x => true));
  }
  
}

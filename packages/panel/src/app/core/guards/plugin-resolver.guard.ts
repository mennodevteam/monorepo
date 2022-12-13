import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { PluginsService } from '../services/plugins.service';

@Injectable({
  providedIn: 'root'
})
export class PluginResolverGuard implements CanActivate {
  constructor(
    private pluginsService: PluginsService,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.pluginsService.plugins.pipe(filter(x => x != undefined)).pipe(take(1)).pipe(map(x => true));
  }

}

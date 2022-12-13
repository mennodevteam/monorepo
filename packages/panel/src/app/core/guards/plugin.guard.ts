import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PluginsService } from '../services/plugins.service';

@Injectable({
  providedIn: 'root'
})
export class PluginGuard implements CanActivate {
  constructor(
    private pluginsService: PluginsService,
    private router: Router,
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (route.data && route.data.plugins) {
        for (const p of route.data.plugins) {
          if (this.pluginsService.activePlugins.indexOf(p) === -1) {
            this.router.navigate(['/plugins/no-permission'], {
              skipLocationChange: true,
            });
            return false;
          }
        }
      }
      return true;
  }
  
}

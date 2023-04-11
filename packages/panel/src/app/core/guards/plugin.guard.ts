import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ShopService } from '../services/shop.service';
import { Status } from '@menno/types';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class PluginGuard implements CanActivate {
  constructor(
    private shopsService: ShopService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const plugin = this.shopsService.shop?.plugins ? this.shopsService.shop?.plugins[0] : undefined;
    if (route.data && route.data['plugins']) {
      for (const p of route.data['plugins']) {
        if (
          plugin?.plugins?.indexOf(p) === -1 ||
          (plugin?.expiredAt && new Date(plugin.expiredAt).valueOf() < Date.now()) ||
          plugin?.status !== Status.Active
        ) {
          this.router.navigate(['/settings'], {
            skipLocationChange: true,
          });
          this.dialog.open(AlertDialogComponent, {
            data: {
              title: this.translate.instant('pluginDialog.title'),
              description: this.translate.instant('pluginDialog.description'),
              hideCancel: true,
            },
          });
          return false;
        }
      }
    }
    return true;
  }
}

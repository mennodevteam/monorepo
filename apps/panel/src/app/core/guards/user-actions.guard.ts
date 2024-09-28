import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ShopService } from '../services/shop.service';
import { Status } from '@menno/types';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserActionsGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    await this.auth.getShopUserResolver();
    if (route.data && route.data['userActions']) {
      for (const a of route.data['userActions']) {
        if (!this.auth.hasAccess(a)) {
          this.router.navigate(['/'], {
            skipLocationChange: true,
          });
          this.dialog.open(AlertDialogComponent, {
            data: {
              title: this.translate.instant('userActionsDialog.title'),
              description: this.translate.instant('userActionsDialog.description'),
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
